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
  
    var originalContext = $originalCanvas[0].getContext("2d");
    var nulledContext = $nulledCanvas[0].getContext("2d");
    var messageContext = $messageCanvas[0].getContext("2d");
  
    var width = $originalCanvas[0].width;
    var height = $originalCanvas[0].height;
  
    // Check if the message is too large for the image
    if ((text.length * 8 + 16) > (width * height * 3)) { // 16 bits for the length
        alert("Text too long for chosen image...");
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
    console.log("Encrypted text:", encryptedText);
  
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
    
    console.log("Message length (binary):", messageLengthBinary);
    console.log("Binary message with length:", binaryMessageWithLength.length, "bits");
  
    // Step 4: Obfuscate the binary message
    var obfuscatedBinaryMessage = obfuscateBinary(binaryMessageWithLength);
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
    
    // Step 1: Extract all LSBs
    var binaryMessage = '';
    for (var i = 0; i < pixels.length; i += 4) {
        for (var j = 0; j < 3; j++) { // Only read RGB, skip Alpha
            binaryMessage += (pixels[i + j] & 1).toString();
            // Stop after we've collected enough bits (safety)
            if (binaryMessage.length > width * height * 3) {
                break;
            }
        }
        if (binaryMessage.length > width * height * 3) {
            break;
        }
    }
    
    console.log("Extracted binary length:", binaryMessage.length, "bits");
    
    // Step 2: Deobfuscate the binary
    var cleanBinary = deobfuscateBinary(binaryMessage);
    console.log("Deobfuscated binary length:", cleanBinary.length, "bits");
    
    if (cleanBinary.length < 16) {
        alert("Could not extract enough data from the image. Are you sure this image contains hidden data?");
        return;
    }
    
    // Step 3: Read message length (first 16 bits)
    var messageLengthBinary = cleanBinary.substr(0, 16);
    var messageLength = parseInt(messageLengthBinary, 2);
    console.log("Extracted message length:", messageLength, "characters");
    
    if (isNaN(messageLength) || messageLength <= 0 || messageLength > 10000) {
        alert("Invalid message length detected. This image may not contain hidden data or the data is corrupted.");
        return;
    }
    
    // Step 4: Extract the actual message binary
    var messageBinary = cleanBinary.substr(16, messageLength * 8);
    console.log("Message binary length:", messageBinary.length, "bits");
    
    if (messageBinary.length < messageLength * 8) {
        alert("The extracted data is incomplete. The image might be corrupted or doesn't contain the complete message.");
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
    
    // Step 7: Display the result
    $(".binary-decode textarea").val(decryptedMessage);
    $(".binary-decode").fadeIn();
    
    if (!decryptedMessage || decryptedMessage.trim() === "") {
        alert("No message was found or the decryption key is incorrect.");
    }
}
