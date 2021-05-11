const sizeOf = require('image-size');
// const detect = require('detect-file-type');
const FileType = require('file-type');
const createIPFS = require('ipfs-http-client');

const draw = async function(fileContentBuffer, textToRender){


    let imageWidth = 500,
        imageHeight = 500,
        percent = 20;
    let radius = 100;
    let lettersPadding = 10;
    let lettersSize = 20;
    let letters = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let digits = "0123456789";
    // let textToRender = "!King Midas";
    let embeddedImage = '';

    try {
        let fileType = await FileType.fromBuffer(fileContentBuffer);
        console.log(fileType);

        if (fileType === undefined ) {
            throw new Error('its not binary file, possibly text file');
        }

        if (!fileType.ext) {
            throw new Error('unknown file type');
        }

        if(!['png', 'jpg'].includes(fileType.ext)) {
            throw new Error('file type not supported: ' + fileType.ext);
        }

        // console.log("image dimensions:");
        let imageSize = sizeOf(fileContentBuffer);

        if (!imageSize.height || !imageSize.width) {
            throw new Error('cant detect image size');
        }

        let base64;
        if (typeof window === 'undefined' || !window.btoa) {
            base64 = fileContentBuffer.toString('base64');
        } else {
            let binary = '';
            let len = uint8.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode( uint8[ i ] );
            }
            base64 = window.btoa( binary );
        }

        // inject image
        imageWidth = imageSize.width;
        imageHeight = imageSize.height;

        radius = Math.round(Math.min(
            imageWidth * percent / 100, imageHeight * percent / 100));

        // let ratio = Math.min(imageWidth / canvasW, imageHeight / canvasH);
        // embeddedImage = '<image x="0" y="0" width="' + Math.round(imageWidth / ratio) + '" height="' + Math.round(imageHeight / ratio) + '" xlink:href="data:' + fileType.mime + ';base64,' + base64 + '"/>';
        embeddedImage = '<image x="0" y="0" width="' + imageWidth + '" height="' + imageHeight + '" xlink:href="data:' + fileType.mime + ';base64,' + base64 + '"/>';

    } catch (e){
        console.log(e);
        console.log('image detect error. ' + e);
    }

    let centerX = imageWidth - radius,
        centerY = radius;

    let letterCoords = {};
    // get letter coords
    for (var i = 0; i < letters.length; i++) {
        let letter = letters.charAt(i);
        let angle = Math.PI * 2 / letters.length * i - Math.PI / 2;

        letterCoords[letter] = {
            x: Math.cos(angle) * (radius - lettersSize/2 - lettersPadding ) + centerX,
            y: Math.sin(angle) * (radius - lettersSize/2 - lettersPadding ) + centerY
        }
    }

    // get digit coords
    for (var i = 0; i < digits.length; i++) {
        let letter = digits.charAt(i);
        let angle = Math.PI * 2 / digits.length * i - Math.PI / 2;

        letterCoords[letter] = {
            x: Math.cos(angle) * (radius - lettersSize * 1.5 - lettersPadding * 3 ) + centerX,
            y: Math.sin(angle) * (radius - lettersSize * 1.5 - lettersPadding * 3 ) + centerY
        }
    }

    let allPoints = [];

    // get points
    for (var i = 0; i < textToRender.length; i++) {
        let letter = textToRender.charAt(i).toUpperCase();
        if (letterCoords.hasOwnProperty(letter)) {
            allPoints.push({x: letterCoords[letter].x, y: letterCoords[letter].y});
        }
    }

    // svg path
    let svgPath = "";
    let dx, dy;
    svgPath += "M" + allPoints[0].x + " " + allPoints[0].y;
    // draw all spliced lines with quadraticCurveTo
    for (var i = 1; i < allPoints.length; i++) {
        dx = allPoints[i].x - allPoints[i-1].x;
        dy = allPoints[i].y - allPoints[i-1].y;
        if (dx === 0 && dy === 0) continue;
        if (dx === 0) {
            svgPath += " v " + dy ;
        } else if (dy === 0) {
            svgPath += " h " + dx;
        } else {
            svgPath += " l " + dx + " " + dy;
        }

    }
    svgPath = '<path d="' + svgPath + '" fill="transparent" stroke="black" stroke-width="' + Math.max(Math.round(radius/50*1.5),1) + '"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + imageWidth + '" height="' + imageHeight + '">'+ embeddedImage + svgPath + '</svg>';

}

const getIPFSFile = async function(ipfshash){
    let fileContentBuffer = Buffer.from([]);
    try {
        // const ipfs = createIPFS({path: '/ip4/127.0.0.1/tcp/4001'});
        const ipfs = createIPFS.create({ timeout: 10000 });

        // const res = await ipfs.get('QmYupw6pgYZ6Ntb64E1Mps2vEUCQZddr3S2BT85iPGd2Ap');
        // const res = await ipfs.get('QmYupw6pgYZ6Ntb64E1Mps2vEUCQZddr3S2BT85iPGd2Ar');
        // const res = await ipfs.get('QmVYZYdr1cHKYEU6fT7rTK3wC73sQQBxnipNNT65bd3wB7');
        const res = await ipfs.get(ipfshash);

        let ipfsAnswer = await res.next();

        let fileChunks = [];
        let fileContent;
        do {
            fileContent = await ipfsAnswer.value.content.next();
            fileContent.done || fileChunks.push(fileContent.value);
        } while (!fileContent.done)

        return Buffer.concat(fileChunks); //uint8array/Buffer

    } catch (e){
        console.log(e);
        console.log('ipfs file receive error. ' + e);
    }
};

module.exports = {draw, getIPFSFile};
