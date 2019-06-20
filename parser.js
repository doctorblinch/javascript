'use strict'

const http = require('http');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

let data = '';

const parse = (data, id) => {
   const dom = new JSDOM(data);
   const document = dom.window.document;
   const first = document.getElementById('ctl00_MainContent_FirstScheduleTable').getElementsByTagName('tr');
   const second = document.getElementById('ctl00_MainContent_SecondScheduleTable').getElementsByTagName('tr');
   const week = {
       1: 'monday',
       2: 'tuesday',
       3: 'wednesday',
       4: 'thursday',
       5: 'friday'
   };

   let firstWeek = {};
   let secondWeek = {};
   for(let i in first){
       if(i>0 && i<6) {

           const firstRow = first[i].getElementsByTagName('td');
           const secondRow = second[i].getElementsByTagName('td');

           for (let j = 1; j<6; j++){
               if (firstWeek[week[j]] === undefined){
                   firstWeek[week[j]] = [];
                   secondWeek[week[j]] = [];
               }
               try {
                   let temp = {};
                   const firstLength = firstRow[j].getElementsByTagName('a').length;
                   const secondLength = secondRow[j].getElementsByTagName('a').length;
                   temp.number = i;
                   temp.name = firstRow[j].getElementsByTagName('a')[0].innerHTML;
                   temp.teacher = firstRow[j].getElementsByTagName('a')[1].innerHTML;
                   temp.classroom = firstRow[j].getElementsByTagName('a')[firstLength-1].innerHTML;
                   firstWeek[week[j]].push(temp);
                   temp.number = i;
                   temp.name = secondRow[j].getElementsByTagName('a')[0].innerHTML;
                   temp.teacher = secondRow[j].getElementsByTagName('a')[1].innerHTML;
                   temp.classroom = secondRow[j].getElementsByTagName('a')[secondLength-1].innerHTML;
                   secondWeek[week[j]].push(temp);
               }
               catch(err){
                   //firstWeek[week[j]].push(' ');
                   //secondWeek[week[j]].push(' ');
               }
           }
       }
   }
   if (id === 1){
       return formatData(firstWeek);
   } else if(id === 2) {
       return formatData(secondWeek);
   }
};

const formatData = (data) =>{
    let result = '';
    const days = Object.keys(data);
    for (const day of days){
        result += '---------------' + '\n' + day +'\n' + '---------------' + '\n';
        for(const lesson in data[day]){
            result += data[day][lesson].number + '.' + data[day][lesson].name + '\n';
            result += 'Teacher: ' + data[day][lesson].teacher + '\n';
            result += 'Classroom: ' + data[day][lesson].classroom + '\n\n' ;
        }
    }
    return result;
};


http.get('http://rozklad.kpi.ua/Schedules/ViewSchedule.aspx?g=894be0b0-9c4b-492e-a3d0-a6950cb1a3e1', (res) =>{
    res.on('data', (chunk)=>{
        data+=chunk;
    });
    res.on('end', ()=>{
        //console.log(data);
        return data;
    });
}).on('error', (err)=>{
    console.log('Error', err);
});
console.log(page);
//parse(data,2)
