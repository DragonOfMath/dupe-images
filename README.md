# dupe-images
Node.js package for finding and removing duplicate images with extreme precision. Uses a modified version of `require-all` to read a directory and `jimp` to compare image data.

Runtime duration is O(n^2) at the worst, but significantly speeds up the more duplicates or similar images there are.

# Installation
```bat
npm install dupe-images --save
```

# Usage
Require `dupe-images` in your code and call `findDuplicates()` on your given directory, which returns a Promise resolving to an array of groups of duplicates.

```js
var {findDuplicates, removeDuplicates} = require('dupe-images');
findDuplicates('./folder').then(duplicates => ...)
```

You can provide the same options as `require-all` uses in a second argument object.

```js
findDuplicates('./folder', {recursive: true, exact: true})
```

Options:
* `recursive: Boolean` allows deep-searching of directories and subdirectories for image files.
* `exact: Boolean` means only images that are exact copies of each other should count as duplicates. If false, images that closely resemble one another are considered duplicates.
* `threshold: Normal` is a value between 0 and 1 that limits the difference between pixels, with 0 being no difference.
* `tolerance: Normal` is a value between 0 and 1 that limits the difference between images after diffing them, with a value close to zero meaning very little differences to be considered duplicates.

Using `removeDuplicates()` is the same structure as `findDuplicates()`, however you are given even more options:
* `rename: Boolean` allows the dupe-remover tool to rename files to a name either you or it prefers more.
* `namePreference: Function` allows you to make a decision for which name to use. It takes two arguments, name1 and name2, and must decide which one to return.
* `typePreference: String` allows you to choose whether to keep `.png`s or `.jpg`s in the case that two duplicates are of equal width and height but of either type.

`removeDuplicates()` returns an Promise that resolves to an object containing two array properties: `retained` for files that were kept/renamed, and `removed` for files that were deleted.
