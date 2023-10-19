const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');


const getHTML = async (keyword) => {
  try {
    const html = (await axios.get(`https://www.jobkorea.co.kr/Search/?stext=${encodeURI(keyword)}`)).data;
    return html;
  } catch (e) {
    console.log(e);
  }
};

const parsing = async (page) => {
  const $ = cheerio.load(page);
  const jobs = [];
  const $jobList = $(".post");
  $jobList.each((idx, node) => {
    const jobTitle = $(node).find(".title:eq(0)").text().trim();
    const company = $(node).find(".name:eq(0)").text().trim();
    const experience = $(node).find(".exp:eq(0)").text().trim();
    const education = $(node).find(".edu:eq(0)").text().trim();
    const regularYN = $(node).find(".option > span:eq(2)").text().trim();
    const region = $(node).find(".long:eq(0)").text().trim();
    const dueDate = $(node).find(".date:eq(0)").text().trim();
    const etc = $(node).find(".etc:eq(0)").text().trim();

    if (
      experience.indexOf("신입") > -1 ||
      experience.indexOf("경력무관") > -1
    ) {

      // jobTitle 열에 줄 바꿈 추가
      const wrappedJobTitle = jobTitle.replace(/(.{20})/g, "$1\n");
      // etc 열에 줄 바꿈 추가
      const wrappedEtc = etc.replace(/(.{20})/g, "$1\n");

      jobs.push({
        jobTitle: wrappedJobTitle, // 줄 바꿈이 적용된 jobTitle 값
        company,
        experience,
        education,
        regularYN,
        region,
        dueDate,
        etc: wrappedEtc, // 줄 바꿈이 적용된 etc 값
      });
    }
  });
  return jobs;
};

const getJob = async (keyword) => {
  const html = await getHTML(keyword);
  const jobs = await parsing(html);
  console.log(jobs);
  return jobs;
};


// 셀의 x 좌표 계산 함수
const calculateCellXPosition = (col, firstColumnWidth, middleColumnWidth, cellPadding) => {
  if (col === 0) {
    return 0;
  } else if (col === 1) {
    return firstColumnWidth + cellPadding;
  } else {
    return firstColumnWidth + cellPadding + (middleColumnWidth + cellPadding) * (col - 1);
  }
};

// 셀의 너비 계산 함수
const calculateCellWidth = (col, firstColumnWidth, middleColumnWidth, lastColumnWidth, cellPadding) => {
  if (col === 0) {
    return firstColumnWidth;
  } else if (col === numCols - 1) {
    return lastColumnWidth;
  } else {
    return middleColumnWidth;
  }
};

  const canvasWidth = 1500; // 캔버스 가로 크기
  const canvasHeight = 400;
  const cellPadding = 100; // 셀 간 여백
  const numCols = 8;
  const borderRadius = 20; // 테두리의 곡선 반지름

  const createTableImage = async (jobs) => {

  // 행, 열의 개수
  const numRows = jobs.length;
  

  // 첫 번째 열과 마지막 열의 비율 설정
  const firstColumnRatio = 1; // 첫 번째 열 비율 (변경 가능)
  const lastColumnRatio = 1; // 마지막 열 비율 (변경 가능)
  const middleColumnRatio = numCols - firstColumnRatio - lastColumnRatio; // 중간 열 비율

  // 캔버스 내에서 첫 번째 열과 마지막 열이 차지할 너비 계산
  const firstColumnWidth = (canvasWidth - (cellPadding * (numCols - 1))) * (firstColumnRatio / numCols);
  const lastColumnWidth = (canvasWidth - (cellPadding * (numCols - 1))) * (lastColumnRatio / numCols);

  // 중간 열의 너비 계산
  const middleColumnWidth = (canvasWidth - firstColumnWidth - lastColumnWidth - (cellPadding * (numCols - 1))) / middleColumnRatio;

  
  
  
  
  
  
  
  
  // 캔버스 높이 계산
  const cellHeight = 10;
  const topMargin = 20; // 위쪽 여백
  const bottomMargin = 20; // 아래쪽 여백
  const canvasHeight = numRows * cellHeight + ((numRows - 1) * cellPadding ) + topMargin + bottomMargin;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const context = canvas.getContext('2d');


  // 표의 스타일 설정
  context.fillStyle = 'Pink'; // 표의 배경색 (변경 가능)
  // context.fillRect(0, 0, canvasWidth, canvasHeight);//사각형
 
  context.strokeStyle = 'black'; // 선 색상
  context.lineWidth = 1; // 선 두께

  // 표의 테두리 그리기
  context.beginPath();
  context.moveTo(borderRadius, 0);
  context.lineTo(canvasWidth - borderRadius, 0);
  context.arcTo(canvasWidth, 0, canvasWidth, borderRadius, borderRadius);
  context.lineTo(canvasWidth, canvasHeight - borderRadius);
  context.arcTo(canvasWidth, canvasHeight, canvasWidth - borderRadius, canvasHeight, borderRadius);
  context.lineTo(borderRadius, canvasHeight);
  context.arcTo(0, canvasHeight, 0, canvasHeight - borderRadius, borderRadius);
  context.lineTo(0, borderRadius);
  context.arcTo(0, 0, borderRadius, 0, borderRadius);
  context.closePath();

  context.fill();
  context.stroke();

  context.fillStyle = 'black'; // 글자색 (변경 가능)
  // context.font = '25px Arial'; // 글꼴 (변경 가능)

  // 표 그리기
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const x = calculateCellXPosition(col, firstColumnWidth, middleColumnWidth, cellPadding);
      const y = row * (cellHeight + cellPadding);

      // 텍스트 그리기 전에 상하좌우 여백을 추가하여 위치 조정
      const textX = x + 10; // 왼쪽 여백
      const textY = y + 10; // 위쪽 여백

      if (col === 0 || col === numCols - 1 || col === 1) {
        context.font = '17px Arial'; // 글꼴 (변경 가능)
        context.fillText(
          jobs[row][Object.keys(jobs[row])[col]],
          textX,
          textY + 17, // 폰트 크기가 17px인 경우, 텍스트의 y 좌표에 추가적인 17px의 여백을 더해줍니다.
          calculateCellWidth(col, firstColumnWidth, middleColumnWidth, lastColumnWidth, cellPadding)
        ); // 셀의 내용 그리기
      } else {
        context.font = '25px Arial'; // 글꼴 (변경 가능)
        context.fillText(
          jobs[row][Object.keys(jobs[row])[col]],
          textX,
          textY + 25, // 폰트 크기가 25px인 경우, 텍스트의 y 좌표에 추가적인 25px의 여백을 더해줍니다.
          calculateCellWidth(col, firstColumnWidth, middleColumnWidth, lastColumnWidth, cellPadding)
        ); // 셀의 내용 그리기
      }
    }
  }

  // 이미지 저장
  const imageBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync('output.png', imageBuffer);

  console.log('이미지가 생성되었습니다.');
};





const crawlingJob = async (keyword) => {
  const jobs = await getJob(keyword);
  await createTableImage(jobs);
};

crawlingJob("node.js");








// const crawlingJob = async (keyword) => {
//   const jobs = await getJob(keyword);

//   const h = [];
//   h.push('<table style="border:1px solid black;border-collapse:collapse;">');
//   h.push('<thead>');
//   h.push('<tr>');
//   h.push('<th style="border:1px solid black;">구인제목</th>');
//   h.push('<th style="border:1px solid black;">회사명</th>');
//   h.push('<th style="border:1px solid black">경력</th>');
//   h.push('<th style="border:1px solid black">학력</th>');
//   h.push('<th style="border:1px solid black">정규직여부</th>');
//   h.push('<th style="border:1px solid black">지역</th>');
//   h.push('<th style="border:1px solid black">구인마감일</th>');
//   h.push('<th style="border:1px solid black">비고</th>');
//   h.push('</tr>');
//   h.push('</thead>');
//   h.push('<tbody>');

//   jobs.forEach(job => {
//     h.push('<tr>');
//     h.push(`'<td style="border:1px solid black">${job.jobTitle}</td>`);
//     h.push(`<td style="border:1px solid black">${job.company}</td>`);
//     h.push(`<td style="border:1px solid black">${job.experience}</td>`);
//     h.push(`<td style="border:1px solid black">${job.education}</td>`);
//     h.push(`<td style="border:1px solid black">${job.regularYN}</td>`);
//     h.push(`<td style="border:1px solid black">${job.region}</td>`);
//     h.push(`<td style="border:1px solid black">${job.dueDate}</td>`);
//     h.push(`<td style="border:1px solid black">${job.etc}</td>`);
//     h.push('</tr>');
//   });

//   h.push('</tbody>');
//   h.push('</table>');

//   const mailSender = {
//     sendGmail: function () {
//       var transporter = nodemailer.createTransport({
//         service: "smtp.naver.com",   // 메일 보내는 곳
//         prot: 465,
//         host: "smtp.naver.com",
//         secure: false,
//         requireTLS: true,
//         auth: {
//           user: "317sis@naver.com",  // 보내는 메일의 주소
//           pass: "ARS1010!"   // 보내는 메일의 비밀번호
//         }
//       });

//       var mailOptions = {
//         from: "317sis@naver.com", // 보내는 메일의 주소
//         to: "317sis@naver.com", // 수신할 이메일
//         subject: "Node.js 구인 회사 정보", // 메일 제목
//         text: 'test',
//         html: h.join("") // 메일 내용
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.log(error);
//         } else {
//           console.log('이메일이 성공적으로 전송되었습니다.');
//         }
//       });
//     }
//   };

//   mailSender.sendGmail();
// };


// // 매일 오후 12시 30분에 crawlingJob 함수 실행 및 이메일 전송
// cron.schedule("30 12 * * *", () => {
//   crawlingJob("node.js");
// });


