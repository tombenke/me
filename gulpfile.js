var gulp = require('gulp');
var data = require('gulp-data');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var filter = require('gulp-filter');
var markdown = require('gulp-markdown');
var mustache = require("gulp-mustache");
var pkg = require('./package.json');
var fs = require('fs');
var path = require('path');
var jsyaml = require( 'js-yaml' );

readYaml = function(fileName) {
    var content = null;

    try {
        content = jsyaml.load(fs.readFileSync(path.resolve(fileName),'utf-8'));
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    return content;
}

gulp.task('markdown', function() {
    return gulp.src("src/md/*.md")
        .pipe(markdown())
        .pipe(gulp.dest("src/partials"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('mustache', ['markdown'], function() {
    return gulp.src("src/templates/*.html")
        .pipe(data(function() { return readYaml('./src/parameters.yml') }))
        .pipe(mustache())
        .pipe(gulp.dest("./docs"))
        .pipe(browserSync.reload({
            stream: true
        }))
});
// Set the banner content
var banner = ['/*!\n',
    ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulp.task('less', function() {
//    var f = filter(['*'/*, '!mixins.less', '!variables.less'*/]);
    return gulp.src('src/less/*.less')
//        .pipe(f)
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('src/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulp.task('minify-css', ['less'], function() {
    return gulp.src('src/css/freelancer.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('src/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify JS
gulp.task('minify-js', function() {
    return gulp.src('src/js/freelancer.js')
        .pipe(uglify())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('src/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Copy vendor libraries from /node_modules into /vendor
gulp.task('copy', ['markdown', 'mustache', 'less', 'minify-css', 'minify-js'], function() {
    gulp.src('src/js/**').pipe(gulp.dest('docs/js'))
    gulp.src('src/css/**').pipe(gulp.dest('docs/css'))
    gulp.src('src/img/**').pipe(gulp.dest('docs/img'))
    gulp.src('src/pdfs/**').pipe(gulp.dest('docs/pdfs'))

    gulp.src(['node_modules/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('docs/vendor/bootstrap'))

    gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('docs/vendor/jquery'))

    gulp.src([
            'node_modules/font-awesome/**',
            '!node_modules/font-awesome/**/*.map',
            '!node_modules/font-awesome/.npmignore',
            '!node_modules/font-awesome/*.txt',
            '!node_modules/font-awesome/*.md',
            '!node_modules/font-awesome/*.json'
        ])
        .pipe(gulp.dest('docs/vendor/font-awesome'))
})

// Run everything
gulp.task('default', ['markdown', 'mustache', 'less', 'minify-css', 'minify-js', 'copy']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: 'docs/'
        },
    })
})

// Dev task with browserSync
gulp.task('watch', ['browserSync', 'markdown', 'mustache', 'less', 'minify-css', 'minify-js'], function() {
   gulp.watch(['src/pdfs/**',
               'src/img/**'], ['copy']);
    gulp.watch('src/less/*.less', ['less']);
    gulp.watch('src/css/*.css', ['minify-css']);
    gulp.watch('src/js/*.js', ['minify-js']);
    gulp.watch('src/md/**', ['markdown']);
    gulp.watch(['src/templates/**',
                'src/partials/**',
                'src/parameters.yml'], ['mustache']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('docs/*.html', browserSync.reload);
    gulp.watch('src/js/**/*.js', browserSync.reload);
});
