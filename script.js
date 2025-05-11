$('button.encode, button.decode').click(function(event) {
    event.preventDefault();
});

// === Image preview functions ===
function previewDecodeImage() {
    var file = document.querySelector('input[name=decodeFile]').files[0];
    previewImage(file, ".decode canvas", function() {
        $(".decode").fadeIn();
    });
}

function previewEncodeImage() {
    var file = document.querySelector("input[name=baseFile]").files[0];
    $(".images .nulled").hide();
    $(".images .message").hide();
    previewImage(file, ".original canvas", function() {
        $(".images .original").fadeIn();
        $(".images").fadeIn();
    });
}

function previewImage(file, canvasSelector, callback) {
    var reader = new FileReader();
    var image = new Image;
    var $canvas = $(canvasSelector);
    var context = $canvas[0].getContext('2d');

    if (file) {
        reader.readAsDataURL(file);
    }

    reader.onloadend = function () {
        image.src = URL.createObjectURL(file);
        image.onload = function() {
            $canvas.prop({
                'width': image.width,
                'height': image.height
            });
            context.drawImage(image, 0, 0);
            callback();
        }
    }
}

// === XOR encryption and decryption ===
function xorEncrypt(message, key) {
    if (!key || key.length === 0) {
        return message; // No encryption if no key
    }
    
    var encrypted = "";
    for (var i = 0; i < message.length; i++) {
        var keyChar = key[i % key.length];
        encrypted += String.fromCharCode(message.charCodeAt(i) ^ keyChar.charCodeAt(0));
    }
    return encrypted;
}

function xorDecrypt(encryptedMessage, key) {
    return xorEncrypt(encryptedMessage, key); // XOR is symmetric
}

// === Obfuscation ===
function obfuscateBinary(binaryMessage) {
    var obfuscated = "";
    for (var i = 0; i < binaryMessage.length; i += 8) {
        obfuscated += binaryMessage.substr(i, 8);
        // Add 2 random bits after each byte
        obfuscated += Math.round(Math.random()) + "" + Math.round(Math.random());
    }
    return obfuscated;
}

function deobfuscateBinary(obfuscatedBinaryMessage) {
    var cleanBinary = "";
    for (var i = 0; i < obfuscatedBinaryMessage.length; i += 10) {
        if (i + 8 <= obfuscatedBinaryMessage.length) {
            cleanBinary += obfuscatedBinaryMessage.substr(i, 8);
        }
    }
    return cleanBinary;
}
// === ENCODING FUNCTION ===
function encodeMessage() {
    $(".error").hide();
    $(".binary").hide();
    
    var text = $("textarea.message").val();
    if (!text || text.trim() === "") {
        alert("Please enter a message to encode");
        return;
    }
    
    var key = $("input[name=key]").val();
  
    // Retrieve the canvas elements and their contexts
    var $originalCanvas = $('.original canvas');
    var $nulledCanvas = $('.nulled canvas');
    var $messageCanvas = $('.message canvas');
  
    if (!$originalCanvas[0]) {
        alert("Please select an image first");
        return;
    }
    
    var originalContext = $originalCanvas[0].getContext("2d");
    var nulledContext = $nulledCanvas[0].getContext("2d");
    var messageContext = $messageCanvas[0].getContext("2d");
  
    var width = $originalCanvas[0].width;
    var height = $originalCanvas[0].height;
  
    // Check if the message is too large for the image
    // We need 10 bits per character (8 bits + 2 obfuscation bits) plus 16 bits for length
    var requiredBits = (text.length * 8 * 10/8) + 16 * 10/8;
    if (requiredBits > (width * height * 3)) {
        alert("Text too long for chosen image. This image can store approximately " + Math.floor((width * height * 3) / (10/8)) + " characters.");
        return;
    }
  
    // Set canvas dimensions for nulled and message canvases
    $nulledCanvas.prop({ 'width': width, 'height': height });
    $messageCanvas.prop({ 'width': width, 'height': height });
  
    // Normalize the image (prepare for embedding the message)
    var original = originalContext.getImageData(0, 0, width, height);
    var pixel = original.data;
    for (var i = 0, n = pixel.length; i < n; i += 4) {
        // Ensure that pixel colors are even (to avoid changing odd LSBs)
        for (var offset = 0; offset < 3; offset++) {
            if (pixel[i + offset] % 2 != 0) {
                pixel[i + offset]--;
            }
        }
    }
    nulledContext.putImageData(original, 0, 0);
  
    // Step 1: Encrypt the text using XOR encryption
    var encryptedText = xorEncrypt(text, key);
    
    console.log("Original text:", text);
    console.log("Encrypted text length:", encryptedText.length);
  
    // Step 2: Convert the encrypted text to binary
    var binaryMessage = "";
    for (var i = 0; i < encryptedText.length; i++) {
        var binaryChar = encryptedText[i].charCodeAt(0).toString(2);
        // Ensure each character is 8 bits long
        while (binaryChar.length < 8) {
            binaryChar = "0" + binaryChar;
        }
        binaryMessage += binaryChar;
    }
    $('.binary textarea').text(binaryMessage); // Display clean binary
  
    // Step 3: Add the length of the message (16 bits)
    var messageLength = encryptedText.length;
    var messageLengthBinary = messageLength.toString(2);
    while (messageLengthBinary.length < 16) {
        messageLengthBinary = "0" + messageLengthBinary;
    }
    var binaryMessageWithLength = messageLengthBinary + binaryMessage;
    
    console.log("Message length (binary):", messageLengthBinary, "=", messageLength);
    console.log("Binary message with length:", binaryMessageWithLength.length, "bits");
  
    // Step 4: Obfuscate the binary message (8 data bits + 2 random bits)
    var obfuscatedBinaryMessage = "";
    for (var i = 0; i < binaryMessageWithLength.length; i += 8) {
        if (i + 8 <= binaryMessageWithLength.length) {
            obfuscatedBinaryMessage += binaryMessageWithLength.substr(i, 8);
            // Add 2 random bits after each byte
            obfuscatedBinaryMessage += Math.round(Math.random()) + "" + Math.round(Math.random());
        } else {
            // Handle the last partial byte if exists
            var remaining = binaryMessageWithLength.substr(i);
            obfuscatedBinaryMessage += remaining;
            while (remaining.length < 8) {
                remaining += "0";
            }
            obfuscatedBinaryMessage += Math.round(Math.random()) + "" + Math.round(Math.random());
        }
    }
    
    $('.binary_Obf_textarea').text(obfuscatedBinaryMessage); // Show obfuscated binary
    
    console.log("Obfuscated binary length:", obfuscatedBinaryMessage.length, "bits");
  
    // Step 5: Hide the obfuscated binary into the image
    var message = nulledContext.getImageData(0, 0, width, height);
    pixel = message.data;
    counter = 0;
    
    for (var i = 0, n = pixel.length; i < n; i += 4) {
        for (var offset = 0; offset < 3; offset++) {
            if (counter < obfuscatedBinaryMessage.length) {
                // Embed each bit of the obfuscated binary into the image
                pixel[i + offset] += parseInt(obfuscatedBinaryMessage[counter]);
                counter++;
            } else {
                break;
            }
        }
        if (counter >= obfuscatedBinaryMessage.length) {
            break;
        }
    }
    
    console.log("Bits embedded:", counter);
    
    messageContext.putImageData(message, 0, 0);
  
    // Show the binary section and images
    $(".binary").fadeIn(); // Show binary section
    $(".images .nulled").fadeIn(); // Show nulled image
    $(".images .message").fadeIn(); // Show message image
    $("#downloadButton").removeClass("hiddenDownloadButton");
    
    alert("Message successfully encoded! Right-click on the resulting image and save it.");
}
// === DECODING FUNCTION ===
function decodeMessage() {
    console.log("Decoding started...");
    $(".error").hide();
    $(".binary-decode").hide();
    
    var key = $("input[name=key]").val();
    
    var $decodeCanvas = $('.decode canvas');
    var decodeContext = $decodeCanvas[0].getContext('2d');
    
    var width = $decodeCanvas[0].width;
    var height = $decodeCanvas[0].height;
    
    console.log("Image dimensions:", width, "x", height);
    
    // Get image data from the canvas
    var imageData = decodeContext.getImageData(0, 0, width, height);
    var pixels = imageData.data;
    
    // Step 1: Extract all LSBs from the image
    var binaryMessage = '';
    // We only need to extract enough bits for a reasonable message
    // Let's limit to 100KB of data max (800,000 bits)
    var maxBits = Math.min(800000, width * height * 3);
    
    for (var i = 0; i < pixels.length && binaryMessage.length < maxBits; i += 4) {
        for (var j = 0; j < 3; j++) { // Only read RGB, skip Alpha
            binaryMessage += (pixels[i + j] & 1).toString();
            if (binaryMessage.length >= maxBits) break;
        }
    }
    
    console.log("Extracted raw binary length:", binaryMessage.length, "bits");
    
    // Step 2: Deobfuscate the binary - try different patterns
    // Original pattern: 8 bits data + 2 bits garbage
    var cleanBinary = '';
    
    // Try standard deobfuscation (8 data bits + 2 random bits)
    cleanBinary = deobfuscateStandard(binaryMessage);
    console.log("Deobfuscated binary length (standard):", cleanBinary.length, "bits");
    
    // Try to extract the message length
    var messageLength = 0;
    var valid = false;
    
    if (cleanBinary.length >= 16) {
        var messageLengthBinary = cleanBinary.substr(0, 16);
        messageLength = parseInt(messageLengthBinary, 2);
        console.log("Extracted message length:", messageLength, "characters");
        
        // Check if message length seems reasonable
        if (!isNaN(messageLength) && messageLength > 0 && messageLength < 10000) {
            valid = true;
        }
    }
    
    // If standard deobfuscation didn't work, try alternative patterns
    if (!valid) {
        console.log("Standard deobfuscation didn't yield valid length, trying alternative patterns...");
        
        // Try just using LSBs directly (no obfuscation)
        var directBinary = binaryMessage;
        if (directBinary.length >= 16) {
            var directLengthBinary = directBinary.substr(0, 16);
            var directLength = parseInt(directLengthBinary, 2);
            console.log("Direct length extraction:", directLength);
            
            if (!isNaN(directLength) && directLength > 0 && directLength < 10000) {
                cleanBinary = directBinary;
                messageLength = directLength;
                valid = true;
                console.log("Using direct LSB extraction");
            }
        }
    }
    
    if (!valid) {
        alert("Could not detect a valid message in this image. Please make sure you've selected an image with embedded data and are using the correct key.");
        return;
    }
    
    // Step 4: Extract the actual message binary
    var messageBinary = cleanBinary.substr(16, messageLength * 8);
    console.log("Message binary length:", messageBinary.length, "bits (need", messageLength * 8, "bits)");
    
    if (messageBinary.length < messageLength * 8) {
        alert("The extracted data is incomplete. This could be because the image doesn't contain enough data or the image was processed after encoding.");
        return;
    }
    
    // Step 5: Convert binary to string
    var encryptedMessage = '';
    for (var i = 0; i < messageBinary.length; i += 8) {
        if (i + 8 <= messageBinary.length) {
            var byte = messageBinary.substr(i, 8);
            encryptedMessage += String.fromCharCode(parseInt(byte, 2));
        }
    }
    console.log("Encrypted message length:", encryptedMessage.length, "characters");
    
    // Step 6: Decrypt the message
    var decryptedMessage = xorDecrypt(encryptedMessage, key);
    console.log("Decrypted message:", decryptedMessage);
    
    // Check if message contains mostly printable characters
    var printableCount = 0;
    for (var i = 0; i < decryptedMessage.length; i++) {
        var code = decryptedMessage.charCodeAt(i);
        if (code >= 32 && code <= 126) {
            printableCount++;
        }
    }
    var printableRatio = printableCount / decryptedMessage.length;
    console.log("Printable character ratio:", printableRatio);
    
    // Step 7: Display the result
    $(".binary-decode textarea").val(decryptedMessage);
    $(".binary-decode").fadeIn();
    
    if (printableRatio < 0.7) {
        alert("Message decoded, but may be incorrect. Try a different key or check if the image was modified after encoding.");
    } else {
        alert("Message successfully decoded!");
    }
}

// Standard deobfuscation (8 data bits + 2 random bits)
function deobfuscateStandard(obfuscatedBinaryMessage) {
    var cleanBinary = "";
    for (var i = 0; i < obfuscatedBinaryMessage.length; i += 10) {
        if (i + 8 <= obfuscatedBinaryMessage.length) {
            cleanBinary += obfuscatedBinaryMessage.substr(i, 8);
        }
    }
    return cleanBinary;
}
