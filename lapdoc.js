let config = require('./config.js');
let map = config.map;
const fs = require('fs');
let async = require('async-q');
const os = require('os');
let pandoc = require('node-pandoc');

const md = require('markdown-it')().use(require('markdown-it-plantuml'), {generateSource: generateUml});
const twig = require('twig');
const _ = require('lodash');
const cheerio = require('cheerio');
const plantuml = require('node-plantuml');
const cp = require('child_process');
const uuid = require('uuid');
const diacritics = require('diacritics').remove;

const gen_promises = [];

function main() {
    let flatten_map = flattenPaths(map);
    let all_content = [];
    let toc;

    return Promise.all([
        cleanDir('plantuml-images/')
    ]).then(() => {
       return async.eachLimit(flatten_map, 1, p => {
            let cmds = [];
            if (p.type === 'file') cmds.push(getFileContent(p.value))
            return Promise.all(cmds)
                .then(([content]) => {
                    if (content) {
                        let html = md.render(content.toString());
                        all_content.push(html);
                    }
                    return 1;
                });
            });
    }).then(() => {
        let meta = buildTocMeta(all_content, flatten_map);
        return buildTemplate({
            content: all_content,
            toc: flatten_map,
            config
        });
    }).then(html => {
        gen_promises.push(writeFile(html, 'doc.html'));
        return Promise.all(gen_promises);
    }).then(() => {
        process.exit(0);
    }).catch(err => {
        console.log({err});
    });
}

function addImgClass(html) {

}

function buildTocMeta(pages, map) {
    let row_i = -1;
    map.forEach(row => {
        if (row.type !== 'file') return;
        row_i++;
        let content = pages[row_i];
        let $ = cheerio.load(
            [
                '<div>',
                content,
                '<div>'
            ].join(''));

        let h1s =$('div').find('h1');
        let anchors = [];
        $(h1s).each(function(h1_i) {
            let text = $(this).text();
            let html_id = buildHtmlId(text, row_i, h1_i);
            $(this).attr({id: html_id});
            anchors.push({
                text,
                html_id
            });
        });
        $('div').find('img').addClass('img-fluid');

        // $('div').find('img').each(function() {
        //     let url = $(this).attr('src');
        //     console.log(url);
        //     $(this).wrap(`<a>`)
            // $(this).prepend(`<a href="${url}" target="_blank>`);
            // $(this).append(`</a>`);
        // });


        row.anchors = anchors;
        pages[row_i] = $.html();
    });
}

function buildHtmlId(text, row_i, h1_i) {
    let safe = diacritics(text);
    safe = text.replace(/[^A-z^0-9]/g, '-');

    return `${safe}-${row_i}-${h1_i}`;
}

function buildTemplate(data) {
    let temp_p = './templates/main.twig';
    return getFileContent(temp_p)
    .then(str => {
        let template = twig.twig({data: str.toString()});
        return template.render(data);
    });
}

function mdToHtml(src, out = "out.html") {
    let content =  md.render(src)
    return writeFile(content, out);
}

function writeFile(content, dest) {
    return new Promise((resolve, reject) => {
        fs.writeFile(dest, content, (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}

function getFileContent(p) {
    return new Promise((resolve, reject) => {
        fs.readFile(p, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

/**
 * @typedef {Object} FileMap
 * @property {String} type 'file' or 'menu'
 * @property {String} value nom ou chemin
 * @property {Number} level
 */

function flattenPaths(map) {
    let roots = Object.keys(map);
    let paths = [];

    // {
    //     type:
    //     value:
    //     level:
    // }

    recursePaths([map], paths)
    return paths;
}

/**
 * @param {Array[Object|String]}
 * @param {Object[]}
 */
function recursePaths(branch, paths, level = 0) {
    branch.forEach(node => {
        if (typeof node === 'string') paths.push({
            type: 'file',
            value: node,
            level
        });
        else {
            Object.keys(node).forEach(k_node => {
                paths.push({
                    type: 'menu',
                    value: k_node,
                    level
                });
            recursePaths(node[k_node], paths, level + 1); });
        }
    });
}



function generateUml(code) {
    let filepath = 'plantuml-images/' + uuid.v4() + '.svg';
    gen_promises.push(generateUmlAsync(code, filepath));
    return filepath;
}

function generateUmlAsync(code, filepath) {
    return new Promise((resolve, reject) => {
        // let gen = plantuml.generate(code, { format: 'png' })
        // var decode = plantuml.decode(req.params.uml);
        var gen = plantuml.generate(code, {format: 'svg'});

        let chunks = [];
        gen.out.on('data', chunk =>  chunks.push(chunk));
        gen.out.on('end', () => {
            let buff = Buffer.concat(chunks);
            writeFile(buff, filepath)
            .then(() => resolve(filepath))
            .catch(err => reject(err));
        });
    });
}

function cleanDir(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) return reject(err);
            async.eachLimit(files, 5, file => {
                return deleteFile(`${dir}${file}`);
            }).then(() => {
                return resolve();
            }).catch(err => {
                return reject(err);
            });
        });
    });
}

function deleteFile(file) {
    return new Promise((resolve, reject) => {
        fs.unlink(file, (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}

main();
