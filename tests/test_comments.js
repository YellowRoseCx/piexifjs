var fs = require("fs");
var piexif = require("../piexif.js");

// Minimal PNG Generator Helper
function generateMinimalPng() {
    // Signature
    var png = "\x89PNG\r\n\x1a\n";

    // IHDR
    var width = 1;
    var height = 1;
    var bit_depth = 8;
    var color_type = 2; // Truecolor
    var compression = 0;
    var filter_method = 0;
    var interlace = 0;

    var ihdr_data = pack(">IIBBBBB", [width, height, bit_depth, color_type, compression, filter_method, interlace]);
    var ihdr_crc = crc32("IHDR" + ihdr_data);
    var ihdr_chunk = pack(">L", [ihdr_data.length]) + "IHDR" + ihdr_data + pack(">L", [ihdr_crc]);
    png += ihdr_chunk;

    // IDAT (minimal 1 pixel red)
    // zlib compression of \x00\xff\x00\x00 (Filter 0, R, G, B)
    // Pre-calculated simple zlib stream for this data:
    // \x78\x9c\x63\xf8\xcf\x00\x00\x03\x03\x01\x00
    // (Or we can rely on a simpler uncompressed zlib block if we wanted, but let's use a hardcoded valid one)
    var raw_idat_data = "\x78\x9c\x63\xf8\xcf\x00\x00\x03\x03\x01\x00"; 
    var idat_crc = crc32("IDAT" + raw_idat_data);
    var idat_chunk = pack(">L", [raw_idat_data.length]) + "IDAT" + raw_idat_data + pack(">L", [idat_crc]);
    png += idat_chunk;

    // IEND
    var iend_crc = crc32("IEND");
    var iend_chunk = pack(">L", [0]) + "IEND" + pack(">L", [iend_crc]);
    png += iend_chunk;

    return png;
}

// CRC32 Helper (copied from piexif.js for test independence)
var crcTable = [];
for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    crcTable[n] = c;
}
function crc32(str) {
    var crc = 0 ^ (-1);
    for (var i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// Pack Helper
function pack(mark, array) {
    // Simplified pack for test usage
    var packed = "";
    var p = 0;
    var littleEndian = mark[0] == "<";
    for (var i = 1; i < mark.length; i++) {
        var c = mark[i];
        var val = array[p];
        if (c == "I" || c == "L") { // 4 bytes
             var b = [
                (val >>> 24) & 0xFF,
                (val >>> 16) & 0xFF,
                (val >>> 8) & 0xFF,
                val & 0xFF
            ];
            if (littleEndian) b.reverse();
            packed += String.fromCharCode.apply(null, b);
        } else if (c == "B") { // 1 byte
            packed += String.fromCharCode(val & 0xFF);
        }
        p++;
    }
    return packed;
}

function strToUcs2(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        bytes.push(code & 0xFF);
        bytes.push((code >> 8) & 0xFF);
    }
    bytes.push(0x00);
    bytes.push(0x00);
    return bytes;
}

function ucs2ToStr(bytes) {
    var str = "";
    for (var i = 0; i < bytes.length - 1; i += 2) {
        var code = bytes[i] + (bytes[i+1] << 8);
        if (code === 0) break; 
        str += String.fromCharCode(code);
    }
    return str;
}

console.log("Starting Comment Tests...");

var imgDesc = "My Image Description";
var userComment = "My User Comment";
var xpCommentStr = "My XP Comment";
var xpCommentBytes = strToUcs2(xpCommentStr);

var zeroth = {};
zeroth[piexif.ImageIFD.ImageDescription] = imgDesc;
zeroth[piexif.ImageIFD.XPComment] = xpCommentBytes;

var exif = {};
exif[piexif.ExifIFD.UserComment] = userComment;

var exifObj = {"0th":zeroth, "Exif":exif, "GPS":{}, "Interop":{}, "1st":{}};
var exifBytes = piexif.dump(exifObj);

// --- Test PNG ---
try {
    var pngClean = generateMinimalPng();
    var newPng = piexif.insert(exifBytes, pngClean);
    
    // SAVE THE FILE
    var pngOutPath = "tests/files/out_comments.png";
    fs.writeFileSync(pngOutPath, newPng, "binary");
    console.log("Saved PNG to " + pngOutPath);

    var loadedExif = piexif.load(newPng);

    // Verify ImageDescription
    if (loadedExif["0th"][piexif.ImageIFD.ImageDescription] !== imgDesc) {
        throw new Error("PNG: ImageDescription mismatch. Got: " + loadedExif["0th"][piexif.ImageIFD.ImageDescription]);
    }

    // Verify UserComment
    if (loadedExif["Exif"][piexif.ExifIFD.UserComment] !== userComment) {
         throw new Error("PNG: UserComment mismatch. Got: " + loadedExif["Exif"][piexif.ExifIFD.UserComment]);
    }

    // Verify XPComment
    var loadedXpCommentBytes = loadedExif["0th"][piexif.ImageIFD.XPComment];
    var loadedXpCommentStr = ucs2ToStr(loadedXpCommentBytes);
    if (loadedXpCommentStr !== xpCommentStr) {
        throw new Error("PNG: XPComment mismatch. Got: " + loadedXpCommentStr);
    }

    console.log("PNG Comment Test Passed");
} catch (e) {
    console.error("PNG Comment Test Failed:", e);
    process.exit(1);
}

// --- Test JPEG ---
try {
    var jpgClean = fs.readFileSync("tests/files/noexif.jpg").toString("binary");
    var newJpg = piexif.insert(exifBytes, jpgClean);
    
    // SAVE THE FILE
    var jpgOutPath = "tests/files/out_comments.jpg";
    fs.writeFileSync(jpgOutPath, newJpg, "binary");
    console.log("Saved JPEG to " + jpgOutPath);
    
    var loadedExif = piexif.load(newJpg);

    // Verify ImageDescription
    if (loadedExif["0th"][piexif.ImageIFD.ImageDescription] !== imgDesc) {
        throw new Error("JPEG: ImageDescription mismatch. Got: " + loadedExif["0th"][piexif.ImageIFD.ImageDescription]);
    }

    // Verify UserComment
    if (loadedExif["Exif"][piexif.ExifIFD.UserComment] !== userComment) {
         throw new Error("JPEG: UserComment mismatch. Got: " + loadedExif["Exif"][piexif.ExifIFD.UserComment]);
    }

    // Verify XPComment
    var loadedXpCommentBytes = loadedExif["0th"][piexif.ImageIFD.XPComment];
    var loadedXpCommentStr = ucs2ToStr(loadedXpCommentBytes);
    if (loadedXpCommentStr !== xpCommentStr) {
        throw new Error("JPEG: XPComment mismatch. Got: " + loadedXpCommentStr);
    }

    console.log("JPEG Comment Test Passed");
} catch (e) {
    console.error("JPEG Comment Test Failed:", e);
    process.exit(1);
}

console.log("All Comment Tests Passed.");
