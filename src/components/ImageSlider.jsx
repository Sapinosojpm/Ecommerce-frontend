// import React from "react";
// import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// const ImageSlider = ({ images }) => {
//   const settings = {
//     dots: true,
//     infinite: true,
//     speed: 800,
//     slidesToShow: 3,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 2500,
//     centerMode: true,
//     centerPadding: "20px",
//     responsive: [
//       {
//         breakpoint: 1024,
//         settings: {
//           slidesToShow: 3,
//           centerPadding: "10px",
//         },
//       },
//       {
//         breakpoint: 768,
//         settings: {
//           slidesToShow: 2,
//           centerPadding: "10px",
//         },
//       },
//       {
//         breakpoint: 480,
//         settings: {
//           slidesToShow: 1,
//           centerPadding: "10px",
//         },
//       },
//     ],
//     prevArrow: (
//       <button className="slick-prev absolute left-4 top-1/2 -translate-y-1/2 text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full">
//         {"<"}
//       </button>
//     ),
//     nextArrow: (
//       <button className="slick-next absolute right-4 top-1/2 -translate-y-1/2 text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full">
//         {">"}
//       </button>
//     ),
//     customPaging: (i) => (
//       <div className="w-3 h-3 bg-gray-500 rounded-full mx-1"></div>
//     ),
//   };

//   return (
//     <div className="my-10 mx-auto max-w-7xl"> {/* Added max-width for better layout */}
//       <Slider {...settings}>
//         {images.map((item, index) => (
//           <div key={index} className="px-2">
//             <div className="relative aspect-w-16 aspect-h-9"> {/* Fixed aspect ratio */}
//               <img
//                 src={item.image}
//                 alt={item.name}
//                 className="w-full h-full object-cover rounded-lg"
//               />
//               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 rounded-lg"></div>
//               <div className="absolute bottom-5 left-5 right-5 text-white bg-black/40 rounded-lg p-3">
//                 <h2 className="text-lg font-semibold">{item.name}</h2>
//                 <p className="text-sm">{item.description}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </Slider>
//     </div>
//   );
// };

// export default ImageSlider;