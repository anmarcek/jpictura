var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var pkg = require('./package.json');
var del = require('del');

var paths = {
    root: '.',
    src: {
        js: [
            'src/js/disclaimer.js',
            'node_modules/jpictura-core/dist/jpictura-core.js',
            'src/js/jpictura.js'
        ],
        less: [
            'src/css/less/disclaimer.less',
            'node_modules/jpictura-core/dist/css/jpictura-core.css',
            'src/css/less/main.less'
        ],
        cssRoot: 'src/css' 
    },
    dist: {
        root: 'dist',
        css: 'dist/css'
    }
};

gulp.task('default', ['watch']);

gulp.task('watch', function () {
    gulp.watch(paths.src.js, { interval: 500 }, ['clean', 'copy-js', 'copy-css']);
    gulp.watch(paths.src.less, { interval: 500 }, ['clean', 'copy-css', 'copy-css']);
});

gulp.task('release', ['js', 'css'], function (callback) {
    callback();
});

gulp.task('js', ['clean', 'copy-js'], function () {
    return gulp
        .src(paths.dist.root + '/' + pkg.name + '.js')
        .pipe(plugins.rename(pkg.name + '.min.js'))
        .pipe(plugins.uglify({
            preserveComments: 'some'
        }))
        .pipe(gulp.dest(paths.dist.root));
});

gulp.task('css', ['clean', 'copy-css'], function () {
    return gulp
        .src(paths.dist.css + '/' + pkg.name + '.css')
        .pipe(plugins.rename(pkg.name + '.min.css'))
        .pipe(plugins.cssnano())
        .pipe(gulp.dest(paths.dist.css));
});

gulp.task('copy-js', function () {
    return gulp
        .src(paths.src.js)
        .pipe(plugins.concat({ path: pkg.name + '.js' }))
        .pipe(plugins.replace(/@\w+/g, replacePlaceholder))
        .pipe(gulp.dest(paths.dist.root));
});

gulp.task('copy-css', function () {
    return gulp
        .src(paths.src.less)
        .pipe(plugins.replace(/@\w+/g, replacePlaceholder))
        .pipe(plugins.less())
        .pipe(gulp.dest(paths.src.cssRoot))
        .pipe(plugins.concat({ path: pkg.name + '.css' }))
        .pipe(gulp.dest(paths.dist.css));
});

gulp.task('clean', function (callback) {
    del.sync([
        paths.dist.root + '**/*',
        paths.src.cssRoot + '/**',
        '!' + paths.src.cssRoot,
        '!' + paths.src.cssRoot + '/less/**'
    ]);
    callback();
});

function replacePlaceholder(placeholder) {
    switch (placeholder) {
        case '@VERSION':
            placeholder = pkg.version;
            break;
        case '@YEAR':
            placeholder = (new Date()).getFullYear();
            break;
        case '@DATE':
            placeholder = (new Date()).toISOString();
            break;
    }
    return placeholder;
}