
/**
 * Returns c converted to labcolor.
 * @param {rgbcolor} c should have fields R,G,B (case insensitive)
 * @return {labcolor} c converted to labcolor
 */
function RGB_to_LAB(c) {
    return xyz_to_lab(rgb_to_xyz(c))
    /**
     * Returns c converted to xyzcolor.
     * @param {rgbcolor} c should have fields R,G,B (case insensitive)
     * @return {xyzcolor} c converted to xyzcolor
     */
    function rgb_to_xyz(c) {
        c = normalize_rgb(c);
        // Based on http://www.easyrgb.com/index.php?X=MATH&H=02
        var R = (c.R / 255);
        var G = (c.G / 255);
        var B = (c.B / 255);

        if (R > 0.04045) R = pow(((R + 0.055) / 1.055), 2.4);
        else R = R / 12.92;
        if (G > 0.04045) G = pow(((G + 0.055) / 1.055), 2.4);
        else G = G / 12.92;
        if (B > 0.04045) B = pow(((B + 0.055) / 1.055), 2.4);
        else B = B / 12.92;

        R *= 100;
        G *= 100;
        B *= 100;

        // Observer. = 2°, Illuminant = D65
        var X = R * 0.4124 + G * 0.3576 + B * 0.1805;
        var Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
        var Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
        return {
            'X': X,
            'Y': Y,
            'Z': Z
        };
    }

    /**
     * Returns c converted to labcolor.
     * @param {xyzcolor} c should have fields X,Y,Z
     * @return {labcolor} c converted to labcolor
     */
    function xyz_to_lab(c) {
        // Based on http://www.easyrgb.com/index.php?X=MATH&H=07
        var ref_Y = 100.000;
        var ref_Z = 108.883;
        var ref_X = 95.047; // Observer= 2°, Illuminant= D65
        var Y = c.Y / ref_Y;
        var Z = c.Z / ref_Z;
        var X = c.X / ref_X;
        if (X > 0.008856) X = pow(X, 1 / 3);
        else X = (7.787 * X) + (16 / 116);
        if (Y > 0.008856) Y = pow(Y, 1 / 3);
        else Y = (7.787 * Y) + (16 / 116);
        if (Z > 0.008856) Z = pow(Z, 1 / 3);
        else Z = (7.787 * Z) + (16 / 116);
        var L = (116 * Y) - 16;
        var a = 500 * (X - Y);
        var b = 200 * (Y - Z);
        return {
            'L': L,
            'a': a,
            'b': b
        };
    }

    /**
     * Returns c converted to uppercase property names (RGBA from rgba).
     * @param {(rgbcolor|rgbacolor)} c should have fields R,G,B, can have field A (case insensitive)
     * @return {(rgbcolor|rgbacolor)} c convertered to uppercase property names
     */
    function normalize_rgb(c) {
        var new_c = {
            R: c.R || c.r || 0,
            G: c.G || c.g || 0,
            B: c.B || c.b || 0
        };
        if (typeof c.a !== "undefined" || typeof c.A !== "undefined") {
            new_c.A = c.A || c.a || 0;
        }
        return new_c;
    }

}