import React from "react";
import { Link } from "react-router-dom";
import Slider, { CustomArrowProps } from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styled from "styled-components";

const Div = styled.div`
  color: white;
  padding: 20px 40px;
`;

//slick을 이용한 carousel
export const Carousel: React.FC = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <div className="h-[500px] mb-[200px] relative">
      <Slider {...settings}>
        <div className="h-full relative">
          <img src="/public/carousel1.jpg" className="w-full h-[500px] object-cover" alt="캐러셀 이미지1" />
          <Div className="absolute left-20 top-1/2 transform -translate-y-1/2 text-3xl text-left">
            지금, 여러가지 두뇌 퀴즈를 <br />
            풀어보세요!
            <br />
            <Link to="/quizPage">
              <button className="btn btn-active mt-6">이동하기</button>
            </Link>
          </Div>
        </div>
        <div className="h-full relative">
          <img src="/public/carousel2.jpg" className="w-full h-[500px] object-cover" alt="캐러셀 이미지2" />
          <Div className="absolute left-20 top-1/2 transform -translate-y-1/2 text-3xl text-left">
            당신의 랭킹을 확인해보세요!
            <br />
            <Link to="/rankList">
              <button className="btn btn-active mt-6">이동하기</button>
            </Link>
          </Div>
        </div>
      </Slider>
    </div>
  );
};

// 다음버튼
const NextArrow = (props: CustomArrowProps) => {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10 p-2.5 text-white h-full"
    >
      ❯
    </button>
  );
};

// 이전버튼
const PrevArrow = (props: CustomArrowProps) => {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10 p-2.5 text-white h-full"
    >
      ❮
    </button>
  );
};
