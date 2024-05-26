const esbuild = require('esbuild');

(async() => {
    const ctx = await esbuild.context(
        {
            entryPoints: ['main.js'],
            outfile: 'space.min.js',
            bundle: true,
            // sourcemap: true,
            minify: true,
            plugins: [
                {
                    name: 'feedback-plugin',
                    setup: function (build) {
                        let count = 0;
                        build.onEnd(result => {
                            if (result.errors.length == 0) {
                                if (count++ === 0) console.log('initial build succeeded:', JSON.stringify(result));
                                else console.log('subsequent build succeeded:', JSON.stringify(result));
                            }
                        });
                    },
                }
            ],
        }
    );
    await ctx.watch();
    console.log('watching...');
})();