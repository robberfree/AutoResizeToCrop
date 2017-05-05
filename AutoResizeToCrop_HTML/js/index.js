var data;

var sourceImgs = new SourceImgs();
var sourceImg;

var templateImg;

var timerLoadSource;
var timerLoadTemplate;
var timerMatch;

var btnMatch;

window.addEventListener('load', loadHandler);
function loadHandler() {
    btnMatch = document.querySelector('.btn-match');
    btnMatch.addEventListener('click', startMatch);
    document.addEventListener('keyup', keyUpHandler)

    timerLoadSource = new Timer(document.querySelector('.indicator-source p:last-child'), document.querySelector('.indicator-source div'));
    timerLoadTemplate = new Timer(document.querySelector('.indicator-template p:last-child'), document.querySelector('.indicator-template div'));
    timerMatch = new Timer(document.querySelector('.indicator-match p:last-child'), document.querySelector('.indicator-match div'));
}

function keyUpHandler(e) {
    if (e.key === 'Enter') {
        startMatch();
    }
}

function startMatch() {
    btnMatch.classList.add('btn-match_m');
    loadData('../data/data.json', loadedDataHandler);
}

function loadData(url, onCompleteHandler) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText);
            onCompleteHandler(data);
        } else {
            console.log('We reached our target server, but it returned an error');
        }
    };

    request.onerror = function () {
        console.log('There was a connection error of some sort');
    };

    request.send();
}

function loadedDataHandler(_data) {
    data = _data;
    setupBanner();

    loadSourceImg('../images/sources/' + data.sourceName, function () {
        loadTemplateImg('../images/templates/' + data.templateName, function () {
            timerMatch.start();

            var templateMatch = new TemplateMatch(templateImg, document.querySelector('.template-canvas'), sourceImg, document.querySelector('.source-canvas'), data);
            var result = templateMatch.matchTemplateScales();

            document.querySelector('.result-position p:last-child').textContent = '(' + result.x + ',' + result.y + ')';
            document.querySelector('.result-scale p:last-child').textContent = '' + (result.scale * 100).toFixed(2) + '%';

            btnMatch.classList.remove('btn-match_m');

            timerMatch.stop();
        });
    });
}

function setupBanner() {
    var banner = document.querySelector('.banner');
    banner.style.width = data.bannerWidth + 'px';
    banner.style.height = data.bannerHeight + 'px';
}

function loadSourceImg(url, onCompleteHandler) {
    timerLoadSource.start();

    sourceImgs.get(url, function (img) {
        sourceImg = img;
        timerLoadSource.stop();

        onCompleteHandler();
    });
}

function loadTemplateImg(url, onCompleteHandler) {
    timerLoadTemplate.start();

    var img = document.createElement('img');
    img.onload = function () {
        templateImg = img;
        timerLoadTemplate.stop();

        //document.body.appendChild(img);

        onCompleteHandler();
    }
    img.src = url;
}
