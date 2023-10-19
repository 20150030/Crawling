const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { createCanvas, registerFont } = require("canvas");
const cron = require("node-cron");
// const fs = require('fs');



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
  const $jobList = $(".post")
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
      jobs.push({
        jobTitle,
        company,
        experience,
        education,
        regularYN,
        region,
        dueDate,
        etc
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

const crawlingJob = async (keyword) => {
  const jobs = await getJob(keyword);

  const h = [];
  h.push('<table style="border:1px solid black;border-collapse:collapse;">');
  h.push('<thead>');
  h.push('<tr>');
  h.push('<th style="border:1px solid black;">구인제목</th>');
  h.push('<th style="border:1px solid black;">회사명</th>');
  h.push('<th style="border:1px solid black">경력</th>');
  h.push('<th style="border:1px solid black">학력</th>');
  h.push('<th style="border:1px solid black">정규직여부</th>');
  h.push('<th style="border:1px solid black">지역</th>');
  h.push('<th style="border:1px solid black">구인마감일</th>');
  h.push('<th style="border:1px solid black">비고</th>');
  h.push('</tr>');
  h.push('</thead>');
  h.push('<tbody>');

  jobs.forEach(job => {
    h.push('<tr>');
    h.push(`'<td style="border:1px solid black">${job.jobTitle}</td>`);
    h.push(`<td style="border:1px solid black">${job.company}</td>`);
    h.push(`<td style="border:1px solid black">${job.experience}</td>`);
    h.push(`<td style="border:1px solid black">${job.education}</td>`);
    h.push(`<td style="border:1px solid black">${job.regularYN}</td>`);
    h.push(`<td style="border:1px solid black">${job.region}</td>`);
    h.push(`<td style="border:1px solid black">${job.dueDate}</td>`);
    h.push(`<td style="border:1px solid black">${job.etc}</td>`);
    h.push('</tr>');
  });

  h.push('</tbody>');
  h.push('</table>');

  
  crawlingJob("node.js");


}


// 크롤링한 데이터를 이미지로 변환하여 저장하는 함수
const convertToImage = async (data) => {
  // 캔버스 생성
  const canvasWidth = 800; // 이미지 가로 크기
  const canvasHeight = 600; // 이미지 세로 크기
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const context = canvas.getContext("2d");

  // 데이터 그래픽 그리기
  const lineHeight = 30; // 행 높이
  const padding = 20; // 여백
  const fontSize = 18; // 폰트 크기
  const fontFamily = "Arial"; // 폰트 패밀리

  context.font = `${fontSize}px ${fontFamily}`;
  context.fillStyle = "#000"; // 텍스트 색상

  // 데이터를 그래픽으로 그리기
  let y = padding + lineHeight;
  data.forEach((item) => {
    context.fillText(item, padding, y);
    y += lineHeight;
  });

  // 이미지 파일로 저장
  const imagePath = "/Users/sin-inseon/Documents"; // 이미지 파일 경로
  const out = fs.createWriteStream(imagePath);
  const stream = canvas.createJPEGStream({ quality: 0.8 });

  await new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });

  return imagePath;
};
// 이미지 데이터가 담긴 변수
const imageData = convertToImag // 이미지 데이터

// 이미지 파일로 저장할 경로와 파일명
const filePath = '/Users/sin-inseon/Documents';

// 이미지 파일로 저장
fs.writeFileSync(filePath, imageData, 'base64');



// // 카카오톡으로 이미지 전송
// const sendKakaoImage = async (imagePath) => {
//   const accessToken = "YOUR_KAKAO_ACCESS_TOKEN"; // 카카오톡 액세스 토큰

//   try {
//     // 이미지 업로드
//     const response = await axios.post(
//       "https://kapi.kakao.com/v2/api/talk/message/image/upload",
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );

//     const imageToken = response.data.uploaded_image_url;

//     // 이미지 메시지 전송
//     await axios.post(
//       "https://kapi.kakao.com/v1/api/talk/friends/message/default/send",
//       {
//         receiver_uuids: '["카카오톡_수신자_식별_UUID"]', // 카카오톡 수신자 UUID
//         template_object: JSON.stringify({
//           object_type: "feed",
//           content: {
//             title: "크롤링 데이터 이미지",
//             image_url: imageToken,
//             link: {
//               web_url: "https://www.example.com", // 이미지 클릭 시 이동할 링크 URL
//               mobile_web_url: "https://www.example.com", // 모바일에서 이미지 클릭 시 이동할 링크 URL
//             },
//           },
//         }),
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
//         },
//       }
//     );

//     console.log("이미지 전송이 완료되었습니다.");
//   } catch (error) {
//     console.error("이미지 전송 중 오류가 발생하였습니다:", error);
//   }
// };

// // 크롤링한 데이터
// const crawledData = [
//   "구인제목: 웹 개발자",
//   "회사명: ABC 주식회사",
//   "경력: 경력무관",
//   "학력: 대학졸업",
//   "정규직여부: 정규직",
//   "지역: 서울",
//   "구인마감일: 2023-05-31",
//   "비고: 별도 기재사항 없음",
// ];

// // 데이터를 이미지로 변환하여 저장
// convertToImage(crawledData)
//   .then((imagePath) => {
//     // 이미지를 카카오톡으로 전송
//     sendKakaoImage(imagePath);
//   })
//   .catch((error) => {
//     console.error("이미지 변환 및 전송 중 오류가 발생하였습니다:", error);
//   });