
import { BookOpen } from "lucide-react";

const Index = () => {
  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1473177104440-ffee2f376098?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb')",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center space-y-6 px-4 text-center text-neutral-100">
        <BookOpen className="h-16 w-16" />
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
          Faith Future Foundations
        </h1>
        <h2 className="text-3xl font-light text-neutral-200 md:text-4xl">
          Coming Soon
        </h2>
        <p className="max-w-2xl text-lg text-neutral-300 md:text-xl">
          Our new website is under construction. We're working hard to bring you insightful courses to deepen your understanding of the Bible.
        </p>
      </div>
    </div>
  );
};

export default Index;
