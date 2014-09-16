# grunt-retina-css v0.0.2

> Grunt task for generating CSS with 2x background-images.

## Getting Started
This task requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin. To install it you can simply clone it to your project node modules. 
Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-retina-css');
```
### Settings

There are a number of options available, which are described below. Please review the [minimatch options](https://github.com/isaacs/minimatch#options) if you didn't before.

#### src
Type: `String|Array`

This defines what file patterns this task will take into account. Can be a string or an array of files and/or minimatch patterns.

#### cwd
Type: `String`

It defines base directory for source files.

#### dest

Type: `String`

It defines base directory for output files.

#### options.retinaPrefix
Type: `String`

This defines pattern to find retina images. It is used to determine background styles, which should be processed.

#### options.resultsCSSFileName
Type: `String|Undefined`

This option defines if we need to write all generated styles to the single file. If it is not defined, result would be appended to the copy of source file.

## Usage example

You can see usage example below. A couple of demos is also placed into repo.
Here is the task configuration example.

```javascript
"retinify": {
    "single": {
        "options": {
            // img1.jpg generates link to img1-x2.jpg
            "retinaPrefix": '-x2',
            // output file name (to write all generated styles into single file)
            "resultsCSSFileName": 'media.css' 
        },
        "cwd": 'demo/src',
        "dest": 'demo/out',
        "src": ['*.css']
    }
}
```
Input css files examples:

styles1.css:

```css
.class-name2 > #some-id, .new-class {
    background: url('/demo/img/fxt1.gif');
}
```

styles2.css:

```css
.class-name2 > #some-id, .new-class {
    background-image: url('/demo/img/fxt2.gif');
}
```

Processing result is going to look like this.
media.css:

```css
@media (x2) {
    .class-name2 > #some-id, .new-class {
        background: url('/demo/img/fxt1-x2.gif');
    }
    .class-name2 > #some-id, .new-class {
        background-image: url('/demo/img/fxt2-x2.gif');
    }
}
```

## License

MIT
