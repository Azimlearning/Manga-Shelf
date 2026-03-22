const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl'); // wait, yauzl might not be installed. Let's use standard JS APIs if possible or just read the buffer and extract strings.
// Since docx is just text inside xml inside zip, let's just use adm-zip if it exists, otherwise just string matching.
