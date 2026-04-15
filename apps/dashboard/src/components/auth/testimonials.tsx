import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Alex Rivera",
    title: "Security Analyst, TechShield Inc.",
    firstPart: "Sycom completely changed how I approach certifications",
    secondPart:
      ". The hands-on labs made concepts click in ways that reading textbooks never could. I passed my CompTIA Security+ on the first try.",
  },
  {
    name: "Priya Sharma",
    title: "IT Manager, CloudFirst Solutions",
    firstPart:
      "Our team's incident response time dropped by 40% after going through Sycom's training",
    secondPart:
      ". The real-world scenarios prepare you for exactly what you'll face in production environments.",
  },
  {
    name: "Marcus Johnson",
    title: "Penetration Tester, RedLine Security",
    firstPart: "I went from help desk to pentesting in under a year thanks to Sycom",
    secondPart:
      ". The structured learning path and lab environments gave me the practical skills employers actually look for.",
  },
  {
    name: "Elena Vasquez",
    title: "CISO, Meridian Health",
    firstPart: "We use Sycom to onboard every new security hire",
    secondPart:
      ". It gets them up to speed faster than any other platform we've tried, and the progress tracking gives me full visibility into their growth.",
  },
];

export function LoginTestimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(Math.floor(Math.random() * testimonials.length));

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[current];

  return (
    <div className="relative flex h-64 items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1 }}
          className="space-y-4 text-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={current}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            className="relative mx-auto max-w-lg"
            initial={{ opacity: 0, filter: "blur(2px)", y: 10 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]">
              <svg
                aria-hidden="true"
                className="size-[220px] object-contain"
                fill="none"
                height="220"
                viewBox="0 0 6 5"
                width="220"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.54533 4.828C4.16133 4.828 3.84333 4.684 3.59133 4.396C3.35133 4.108 3.23133 3.712 3.23133 3.208C3.23133 2.644 3.41133 2.104 3.77133 1.588C4.13133 1.072 4.68933 0.616 5.44533 0.22L5.76933 0.67C5.12133 1.054 4.68933 1.438 4.47333 1.822C4.25733 2.206 4.14933 2.626 4.14933 3.082L3.68133 3.82C3.68133 3.52 3.77133 3.28 3.95133 3.1C4.14333 2.908 4.38333 2.812 4.67133 2.812C4.94733 2.812 5.18133 2.902 5.37333 3.082C5.56533 3.262 5.66133 3.502 5.66133 3.802C5.66133 4.09 5.55933 4.336 5.35533 4.54C5.15133 4.732 4.88133 4.828 4.54533 4.828ZM1.50333 4.828C1.11933 4.828 0.801328 4.684 0.549328 4.396C0.309328 4.108 0.189328 3.712 0.189328 3.208C0.189328 2.644 0.369328 2.104 0.729328 1.588C1.08933 1.072 1.64733 0.616 2.40333 0.22L2.72733 0.67C2.07933 1.054 1.64733 1.438 1.43133 1.822C1.21533 2.206 1.10733 2.626 1.10733 3.082L0.639328 3.82C0.639328 3.52 0.729328 3.28 0.909328 3.1C1.10133 2.908 1.34133 2.812 1.62933 2.812C1.90533 2.812 2.13933 2.902 2.33133 3.082C2.52333 3.262 2.61933 3.502 2.61933 3.802C2.61933 4.09 2.51733 4.336 2.31333 4.54C2.10933 4.732 1.83933 4.828 1.50333 4.828Z"
                  fill="white"
                />
              </svg>
            </div>
            <p className="pl-4 font-sans text-2xl/relaxed font-semibold text-white/70">
              <span className="text-white">{testimonial?.firstPart}.</span>
              {testimonial?.secondPart.startsWith(".")
                ? testimonial.secondPart.slice(1)
                : testimonial?.secondPart}
              &rdquo;
            </p>
          </motion.div>

          <motion.p
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            className="font-sans text-xs text-white/40"
            initial={{ opacity: 0, filter: "blur(2px)", y: 10 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            {testimonial?.name}, {testimonial?.title}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
