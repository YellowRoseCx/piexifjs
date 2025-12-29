Piexifjs v3
========


This release (v3.0.0) transforms piexifjs into a format-agnostic library with native PNG support.

Key Features:
- **PNG Support:** Full capabilities to `load`, `insert`, and `remove` Exif data in PNG files using the standard `eXIf` chunk.
- **Spec Compliance:** Correct handling of `UserComment` tags, fixing a long-standing issue with invalid text encoding by implementing the required ASCII header logic.
- **Robustness:** Added internal CRC32 calculation for valid PNG generation.

Changes:
- Bumped version to 3.0.0 across all package and documentation files.
- Updated README with PNG usage instructions.
- Added new test suite `tests/test_comments.js` and updated test scripts.
- Cleaned up variable hoisting in modified functions.
 

 
```
npm install git+https://github.com/YellowRoseCx/piexifjs.git
```
 
Thank you for using piexifjs!


How to Use
----------

- :code:`var exifObj = piexif.load(data)` - Get exif data as *object*. *data* must be a *string* that starts with "\data:image/jpeg;base64,"(DataURL), "\data:image/png;base64,"(DataURL), "\\xff\\xd8", "\\x89\\x50\\x4e\\x47", or "Exif".
- :code:`var exifStr = piexif.dump(exifObj)` - Get exif as *string* to insert into JPEG or PNG.
- :code:`piexif.insert(exifStr, data)` - Insert exif into JPEG or PNG. If *data* is DataURL, returns JPEG or PNG as DataURL. Else if *data* is binary as *string*, returns JPEG or PNG as binary as *string*.
- :code:`piexif.remove(data)` - Remove exif from JPEG or PNG. If *data* is DataURL, returns JPEG or PNG as DataURL. Else if *data* is binary as *string*, returns JPEG or PNG as binary as *string*.

Use with File API or Canvas API.

Example
-------

.. code:: html

    <input type="file" id="files" accept="image/jpeg, image/png" />
    <script src="/js/piexif.js" />
    <script>
    function handleFileSelect(evt) {
        var file = evt.target.files[0];
        
        var zeroth = {};
        var exif = {};
        var gps = {};
        zeroth[piexif.ImageIFD.Make] = "Make";
        zeroth[piexif.ImageIFD.XResolution] = [777, 1];
        zeroth[piexif.ImageIFD.YResolution] = [777, 1];
        zeroth[piexif.ImageIFD.Software] = "Piexifjs";
        exif[piexif.ExifIFD.DateTimeOriginal] = "2010:10:10 10:10:10";
        exif[piexif.ExifIFD.LensMake] = "LensMake";
        exif[piexif.ExifIFD.Sharpness] = 777;
        exif[piexif.ExifIFD.LensSpecification] = [[1, 1], [1, 1], [1, 1], [1, 1]];
        gps[piexif.GPSIFD.GPSVersionID] = [7, 7, 7, 7];
        gps[piexif.GPSIFD.GPSDateStamp] = "1999:99:99 99:99:99";
        var exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
        var exifStr = piexif.dump(exifObj);

        var reader = new FileReader();
        reader.onload = function(e) {
            var inserted = piexif.insert(exifStr, e.target.result);

            var image = new Image();
            image.src = inserted;
            image.width = 200;
            var el = $("<div></div>").append(image);
            $("#resized").prepend(el);

        };
        reader.readAsDataURL(file);
    }
    
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    </script>

Dependency
----------

No dependency. Piexifjs just needs standard JavaScript environment.

Environment
-----------

Both client-side and server-side. Standard browsers(Tested on IE11, Opera28, and PhantomJS) and Node.js.

Issues
------

Give me details. Environment, code, input, output. I can do nothing with abstract.

License
-------

This software is released under the MIT License, see LICENSE.txt.
