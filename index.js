let cheerio = require('cheerio');
let fs = require('fs');
let request = require('request-promise');

const baseUrl = 'https://www.lds.org';
const baseGeneralConferenceUrl = `${baseUrl}/general-conference`;
const topicsUrl = `${baseGeneralConferenceUrl}/topics?lang=eng`;


function getTopics() {
    return request(topicsUrl).then((htmlString) => {
        let $ = cheerio.load(htmlString);
        return $('.lumen-tile__title > a').map((i, el) => {
            return $(el).attr('href');
        }).get();
    });
}

function getTopic(topicUrl) {
    return request(`${baseUrl}${topicUrl}`).then((htmlString) => {
        let $ = cheerio.load(htmlString);
        let topic = $('.topic-page > .title-block > .title').text();

        let talkEls = $('.lumen-tile__text-wrapper');
        let talks = talkEls.map((i, el) => {
            let title = $(el).find('a').text().trim();
            let speaker = $(el).find('.lumen-tile__content').text().trim();
            let date = $(el).find('.lumen-tile__metadata').text().trim();
            let href = $(el).find('a').attr('href').trim();
            return {
                title: title,
                speaker: speaker,
                href: href,
                date: date
            };
        }).get();

        return {
            title: topic,
            talks: talks
        };
    });
}

function outputTopics(topics) {
    let csv = '"Topic","Talk","Speaker","Date","URL"';
    for (let topic of topics) {
        for (let talk of topic.talks) {
            csv += `\n"${topic.title}","${talk.title}","${talk.speaker}","${talk.date}","${baseUrl}${talk.href}"`;
        }
    }
    fs.writeFileSync('topics.csv', csv);
    console.log("DONE!!!")
}


getTopics().then((topicUrls) => {
    let topicPromises = topicUrls.map((url) => {
        return getTopic(url);
    });
    Promise.all(topicPromises).then((topics) => {
        outputTopics(topics);
    });
});
