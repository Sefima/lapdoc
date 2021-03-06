# Lapdoc

Lapdoc is a lightweight documentation tool for power users. It features :

![Lapdoc demo](images/lapdoc-main.PNG)

- [x] Compose your documentation in markdown and plantuml, in individual files
- [x] Merge all the markdown files into a gorgeous webpage featuring a table of content sidebar
- [x] The webpage works off the internet, you can give it to your client or boss and it will work!
- [x] Clever syntax highlighting
- [x] Node.js toolchain
- [x] Organize your categories and subcategories as you want, with infinite levels of depth
- [ ] Builds a PDF version of your documentation

## Setup

Prerequisites :
- graphviz
- the command `plantuml` must be in your `$PATH`

Clone this repository and run :
```bash
npm install
```
Put your markdown files in `./docs`, then edit `config.js`.

```javascript
module.exports = {
    app: {
        title: "Lapdoc",
    },
    map: {
        "docs/Welcome.md",
        {
            "Setup": ["docs/Setup.md"]
        },
    }
};

```

Now, you can build your documentation into a gorgeous deliverable!
```
node lapdoc.js
```
Finally open `doc.html` in a browser, it's at the root of this project.

## Roadmap

- [ ] build a PDF
- [ ] Lazy reloading on change
- [ ] Custom logo





