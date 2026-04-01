"use client";

import Navbar from "../navbar/navbar";

export default function GalleryPage() {
  // Array of 20 photos with placeholder URLs and captions
  const photos = [
    { src: "/anirban01.jpg", caption: "Student practicing violin scales" },
    { src: "/anirban02.jpg", caption: "Group violin lesson in progress" },
    { src: "/anirban03.jpg", caption: "Performing at the annual recital" },
    { src: "/anirbanda.jpg", caption: "Close-up of violin strings" },
    { src: "/background.jpg", caption: "Mastering a new piece" },
    { src: "/ABBaba.jpg", caption: "Solo performance on stage" },
    { src: "/anirban01.jpg", caption: "Tuning the violin before class" },
    { src: "/anirban02.jpg", caption: "Learning advanced techniques" },
    { src: "https://source.unsplash.com/random/800x600?music-sheet", caption: "Reading sheet music" },
    { src: "https://source.unsplash.com/random/800x600?violinist", caption: "Young violinist in action" },
    { src: "https://source.unsplash.com/random/800x600?practice", caption: "Daily practice session" },
    { src: "https://source.unsplash.com/random/800x600?performance", caption: "Ensemble rehearsal" },
    { src: "https://source.unsplash.com/random/800x600?music-class", caption: "Instructor guiding a student" },
    { src: "https://source.unsplash.com/random/800x600?violin-lesson", caption: "Perfecting bowing technique" },
    { src: "https://source.unsplash.com/random/800x600?recital", caption: "Concert preparation" },
    { src: "https://source.unsplash.com/random/800x600?string-instrument", caption: "Exploring new melodies" },
    { src: "https://source.unsplash.com/random/800x600?music-room", caption: "Classroom music session" },
    { src: "https://source.unsplash.com/random/800x600?violin-performance", caption: "Live performance moment" },
    { src: "https://source.unsplash.com/random/800x600?music-education", caption: "Building musical confidence" },
    { src: "https://source.unsplash.com/random/800x600?violin-practice", caption: "Final rehearsal before the show" },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold font-palisade text-center text-white mb-12">
            Violin Learning Gallery
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {photos.map((photo, index) => (
              <div key={index} className="flex flex-col items-center">
                <img
                  src={photo.src}
                  alt={photo.caption}
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
                <p className="mt-4 text-center text-lg font-medium">
                  {photo.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}