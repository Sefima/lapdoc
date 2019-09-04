let scroll_tm; // scroll timeout
let elements_positions = [];

function trackAnchor() {
    $(window).scroll(function() {
        if (scroll_tm) clearTimeout(scroll_tm);
        scroll_tm = setTimeout(function() {
            let scrollTop = $(window).scrollTop();
            let elem = findClosestElementFromScroll(scrollTop);
            if (!elem) return;
            setWindowHash("#" + elem.id);
            setNavActive(elem);
        }, 50);
    });
}

function setNavActive(elem) {
    elements_positions.forEach(o_elem => {
        $(o_elem.li).removeClass('active');
    });
    $(elem.li).addClass('active');
}

function findClosestElementFromScroll(scrollTop) {
    for (let i in elements_positions) {
        if (elements_positions[i].top > scrollTop + 100) {
            if (i === 0) return elements_positions[0];
            return elements_positions[i - 1];
        }
    }
}

function setWindowHash(hash) {
    if(history.pushState) {
        history.pushState(null, null, hash);
    }
    else {
        location.hash = hash;
    }
}

function findContentLi(h1, sidebar_lis) {
    let id = $(h1).attr('id');
    let found;
    $(sidebar_lis).each(function() {
        if (found) return false; // stops the each
        let links = $(this).find('a');
        if ($(links[0]).attr('href') === '#' + id)
            found = links[0];
    });
    return found;
}

function recordElementsPosition() {
    let content = $('#posts-content');
    let h1s = $(content).find('h1');
    let sidebar_lis = $('#sidebar').find('li');
    $(h1s).each(function() {
        elements_positions.push({
            id: $(this).attr('id'),
            top: $(this).offset().top,
            li: findContentLi(this, sidebar_lis)
        });
    });
}

function onResize() {
    recordElementsPosition();
}


window.onresize = onResize;

$(window).on('load', function() {
    recordElementsPosition();
    if (elements_positions.length)
        setNavActive(elements_positions[0]);
    trackAnchor();
});

