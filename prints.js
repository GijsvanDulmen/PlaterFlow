module.exports = {
	// Possibility to auto upload to a certain directory for gcode files, example given
    uploadToFolder: 'test-plater-flow',
	
	// Plater settings.
    // Width and height refer to build plate dimensions.
    // Spacing refers to the minimum amount of mm between objects, example given
    plate: { width: 145, height: 145, spacing: 1.3 },

    // Base folder to put all the files after generation
    baseFolder: './output-temp',

    // default printer
    printer: 'v2',
	
	// Your sets.
    // Provided is an example of auto rename (to accent and base) based on a pattern inside the name of the STLs.
    sets: [
        {
            // specific printer
            printer: 'v2',
            name: 'accent',
            
            // Use this color for thumbnails
            color: 0xff0000,

            // Will create for every plate two seperate plates
            // with half of what was on the full plate
            createHalfPlates: true,

            // Rotate all the parts found
            rotate: 30,
            source: {
                type: 'directories',
                directories: [
                    './input'
                ],
                includePattern: ['[a]', '[A]'],
            },
            profile: 'titanx'
        },
        {
            name: 'otheraccent',
            color: 0xff0000,
            createHalfPlates: true,
            rotate: 30,
            scale: 50,
            source: {
                type: 'directories',
                directories: [
                    './input'
                ],
                includePattern: ['[b]', '[B]']
            },
            profile: 'titanx'
        },
        {
            name: 'base',
            color: 0x6a6e75,
            createHalfPlates: true,
            rotate: 30,
            source: {
                type: 'directories',
                directories: [
                    './input'
                ],
                excludePattern: ['[a]', '[A]', '[b]', '[B]']
            },
            profile: 'titanx'
        }
    ]
}