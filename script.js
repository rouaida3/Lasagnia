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
      obfuscated += Math.round(Math.random()) + "" + Math.round(Math.random());
  }
  return obfuscated;
}

function deobfuscateBinary(obfuscatedBinaryMessage) {
  var cleanBinary = "";
  for (var i = 0; i < obfuscatedBinaryMessage.length; i += 10) {
      cleanBinary += obfuscatedBinaryMessage.substr(i, 8);
  }
  return cleanBinary;
}
// === ENCODING FUNCTION ===
function encodeMessage() {
    $(".error").hide();
    $(".binary").hide();
    
    var text = $("textarea.message").val();
    var key = $("input[name=key]").val();
  
    var $originalCanvas = $('.original canvas');
    var $nulledCanvas = $('.nulled canvas');
    var $messageCanvas = $('.message canvas');
  
    var originalContext = $originalCanvas[0].getContext("2d");
    var nulledContext = $nulledCanvas[0].getContext("2d");
    var messageContext = $messageCanvas[0].getContext("2d");
  
    var width = $originalCanvas[0].width;
    var height = $originalCanvas[0].height;
  
    if ((text.length * 8 + 16) > (width * height * 3)) { // add 16 bits for the length
        $(".error").text("Text too long for chosen image...").fadeIn();
        return;
    }
  
    $nulledCanvas.prop({ 'width': width, 'height': height });
    $messageCanvas.prop({ 'width': width, 'height': height });
  
    // Normalize the image
    var original = originalContext.getImageData(0, 0, width, height);
    var pixel = original.data;
    for (var i = 0, n = pixel.length; i < n; i += 4) {
        for (var offset = 0; offset < 3; offset++) {
            if (pixel[i + offset] % 2 != 0) {
                pixel[i + offset]--;
            }
        }
    }
    nulledContext.putImageData(original, 0, 0);
  
    // Step 1: Encrypt text
    var encryptedText = xorEncrypt(text, key);
  
    // Step 2: Convert encrypted text to binary
    var binaryMessage = "";
    for (var i = 0; i < encryptedText.length; i++) {
        var binaryChar = encryptedText[i].charCodeAt(0).toString(2);
        while (binaryChar.length < 8) {
            binaryChar = "0" + binaryChar;
        }
        binaryMessage += binaryChar;
    }
    $('.binary textarea').text(binaryMessage); // Show clean binary
  
    // Step 3: Add message length (16 bits)
    var messageLength = encryptedText.length;
    var messageLengthBinary = messageLength.toString(2);
    while (messageLengthBinary.length < 16) {
        messageLengthBinary = "0" + messageLengthBinary;
    }
    var binaryMessageWithLength = messageLengthBinary + binaryMessage;
  
    // Step 4: Obfuscate the binary
    var obfuscatedBinaryMessage = obfuscateBinary(binaryMessageWithLength);
    $('.binary_Obf_textarea').text(obfuscatedBinaryMessage); // Show obfuscated binary
  
    // Step 5: Hide obfuscated binary into the image
    var message = nulledContext.getImageData(0, 0, width, height);
    pixel = message.data;
    var counter = 0;
    for (var i = 0, n = pixel.length; i < n; i += 4) {
        for (var offset = 0; offset < 3; offset++) {
            if (counter < obfuscatedBinaryMessage.length) {
                pixel[i + offset] += parseInt(obfuscatedBinaryMessage[counter]);
                counter++;
            }
        }
    }
    messageContext.putImageData(message, 0, 0);
  
    $(".binary").fadeIn(); // Show binary section
    $(".images .nulled").fadeIn(); // Show nulled image
    $(".images .message").fadeIn(); // Show message image
  }
  
// === DECODING FUNCTION ===
function decodeMessage() {
    var $originalCanvas = $('.decode canvas');
    var originalContext = $originalCanvas[0].getContext("2d");
  
    var original = originalContext.getImageData(0, 0, $originalCanvas.width(), $originalCanvas.height());
    var pixel = original.data;
  
    // Step 1: Extract bits
    var binaryMessage = "";
    for (var i = 0, n = pixel.length; i < n; i += 4) {
        for (var offset = 0; offset < 3; offset++) {
            var value = 0;
            if (pixel[i + offset] % 2 != 0) {
                value = 1;
            }
            binaryMessage += value;
        }
    }
  
    // Step 2: Deobfuscate
    var cleanBinaryMessage = deobfuscateBinary(binaryMessage);
  
    // Step 3: Read message length (first 16 bits)
    var messageLengthBinary = cleanBinaryMessage.substr(0, 16);
    var messageLength = parseInt(messageLengthBinary, 2);
  
    // Step 4: Extract real message binary
    var realMessageBinary = cleanBinaryMessage.substr(16, messageLength * 8);
  
    // Step 5: Convert binary to text
    var output = "";
    for (var i = 0; i < realMessageBinary.length; i += 8) {
        var c = 0;
        for (var j = 0; j < 8; j++) {
            c <<= 1;
            c |= parseInt(realMessageBinary[i + j]);
        }
        output += String.fromCharCode(c);
    }
  
    // Step 6: Decrypt using key
    var key = $("input[name=key]").val();
    var decryptedMessage = xorDecrypt(output, key);
  
    // Step 7: Display result
    $('.binary-decode textarea').text(decryptedMessage);
    $('.binary-decode').fadeIn();
  }
  
}
