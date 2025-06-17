
import { BookOpen } from "lucide-react";

const Index = () => {
  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center"
      style={{
        backgroundImage: "url('/lovable-uploads/1174d5e1-9ba9-4d08-9b4a-255cb5f8cd4a.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center space-y-6 px-4 text-center text-white">
        <BookOpen className="h-16 w-16 text-yellow-300 drop-shadow-lg" />
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl drop-shadow-2xl">
          RE: GOD
        </h1>
        <h2 className="text-3xl font-light text-yellow-100 md:text-4xl drop-shadow-lg">
          Coming Soon
        </h2>
        <p className="max-w-2xl text-lg text-orange-100 md:text-xl drop-shadow-lg">
          Our new website is under construction. We're working hard to bring you insightful courses to deepen your understanding of the Bible.
        </p>
      </div>
    </div>
  );
};

export default Index;
