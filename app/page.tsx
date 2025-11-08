"use cache";

import { Github, Instagram, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModeToggle } from "@/components/mode";
import { Pointer } from "./pointer";

export default async function Page() {
  return (
    <>
      <Pointer />
      <div className="bg-slate-900 w-full h-full text-gray-400">
        <div className="w-full container lg:max-w-[1600px] mx-auto py-10 md:py-[5em] px-4 flex gap-5 md:flex-row flex-col">
          <div className="flex flex-1 flex-col h-[calc(100vh-10em)] sticky top-[5em] z-10">
            <h1 className="text-4xl flex items-center gap-3 text-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 169 168"
                fill="currentColor"
                className="inline-block h-24 w-24 -mx-8 -my-10 -mr-10 pb-px align-middle"
              >
                <g transform="translate(-857.568 -473.344)">
                  <g transform="translate(857.568 473.344)" fill="transparent">
                    <path
                      d="M 84.49999237060547 155.2491149902344 C 81.587646484375 155.2491149902344 78.74848937988281 154.6988220214844 76.06140899658203 153.6135406494141 C 73.28136444091797 152.49072265625 70.78355407714844 150.8396301269531 68.63738250732422 148.7061462402344 L 19.59810066223145 99.95704650878906 C 17.43433952331543 97.80608367919922 15.75942707061768 95.29632568359375 14.6198616027832 92.49745941162109 C 13.51892757415771 89.79343414306641 12.96070957183838 86.93447875976562 12.96070957183838 84 C 12.96070957183838 81.06549835205078 13.51892757415771 78.20654296875 14.6198616027832 75.50252532958984 C 15.75942707061768 72.70365142822266 17.43433952331543 70.19389343261719 19.59810066223145 68.04293823242188 L 68.63738250732422 19.29384803771973 C 70.78355407714844 17.16036987304688 73.28136444091797 15.5092830657959 76.06140899658203 14.38645648956299 C 78.74832916259766 13.30123996734619 81.58766174316406 12.7509126663208 84.49981689453125 12.7509126663208 C 84.5 12.7509126663208 84.49981689453125 12.7509126663208 84.49999237060547 12.7509126663208 C 87.41233825683594 12.75089168548584 90.25149536132812 13.30117416381836 92.93857574462891 14.38645648956299 C 95.71862030029297 15.5092830657959 98.2164306640625 17.16036987304688 100.3626022338867 19.29384803771973 L 149.4019012451172 68.04295349121094 C 151.565673828125 70.19391632080078 153.2405853271484 72.70367431640625 154.380126953125 75.50252532958984 C 155.4810638427734 78.20654296875 156.0392761230469 81.06549835205078 156.0392761230469 84 C 156.0392761230469 86.93447875976562 155.4810638427734 89.79345703125 154.380126953125 92.49747467041016 C 153.2405853271484 95.29632568359375 151.565673828125 97.80610656738281 149.4019012451172 99.95706176757812 L 100.3626251220703 148.7061462402344 C 98.21644592285156 150.8396301269531 95.71862030029297 152.49072265625 92.93857574462891 153.6135406494141 C 90.25149536132812 154.6988220214844 87.41233825683594 155.2491149902344 84.49999237060547 155.2491149902344 Z"
                      stroke="none"
                    />
                    <path
                      d="M 84.49999237060547 15.25088500976562 C 79.18018341064453 15.25088500976562 74.17266082763672 17.31636047363281 70.39987182617188 21.06683349609375 L 21.36061096191406 69.81597900390625 C 17.55601501464844 73.59804534912109 15.46070861816406 78.63536071777344 15.46070861816406 83.99997711181641 C 15.46070861816406 89.36461639404297 17.55599975585938 94.40193176269531 21.36061096191406 98.18404388427734 L 70.39987182617188 146.9331359863281 C 74.17266082763672 150.6836242675781 79.18018341064453 152.7490997314453 84.49999237060547 152.7490997314453 C 89.81977844238281 152.7490997314453 94.82730102539062 150.6836242675781 98.60011291503906 146.9331359863281 L 147.639404296875 98.18404388427734 C 151.4440002441406 94.40195465087891 153.5392761230469 89.36461639404297 153.5392761230469 84 C 153.5392761230469 78.63538360595703 151.4440002441406 73.59804534912109 147.639404296875 69.81595611572266 L 98.60009002685547 21.06683349609375 C 94.82730102539062 17.31636047363281 89.81977844238281 15.25088500976562 84.49999237060547 15.25088500976562 M 84.49999237060547 10.25088500976562 C 90.87481689453125 10.25088500976562 97.2496337890625 12.67420959472656 102.125114440918 17.52082824707031 L 151.1644287109375 66.26995086669922 C 160.99755859375 76.04492950439453 160.99755859375 91.95507049560547 151.1644287109375 101.7300491333008 L 102.1251373291016 150.4791412353516 C 92.37416076660156 160.1724243164062 76.62582397460938 160.1724243164062 66.87484741210938 150.4791412353516 L 17.83558654785156 101.7300491333008 C 8.002426147460938 91.95507049560547 8.002426147460938 76.04490661621094 17.83558654785156 66.26995086669922 L 66.87484741210938 17.52082824707031 C 71.75033569335938 12.67420959472656 78.12516784667969 10.25088500976562 84.49999237060547 10.25088500976562 Z"
                      stroke="none"
                    />
                  </g>
                  <g transform="translate(576.687 249.079)">
                    <path
                      d="M390.623,330.884h-5.735V300.492l-18.862,19.061c-1.093-1-1.693-1.5-2.246-2.053-7-6.995-13.949-14.049-21.033-20.96-1.808-1.764-2.9-3.515-2.539-6.11a37.276,37.276,0,0,0,.035-4.712l25.064,25.263,25.317-25.508Z"
                      transform="translate(0)"
                    />
                    <path
                      d="M346.423,333.983v14.376H340.6V319.725l28.716,28.791c-2.085,0-4.413.131-6.713-.069a4.517,4.517,0,0,1-2.355-1.468c-4.416-4.4-8.777-8.848-13.156-13.282Z"
                      transform="translate(-0.236 -17.5)"
                    />
                  </g>
                </g>
              </svg>
              ehfooz-ur-Rehman
            </h1>
            <h2 className="text-xl font-medium mt-2 mb-2 text-gray-300">
              Full Stack Developer
            </h2>
            <p className="w-3/4 mb-4">
              I enjoy turning complex problems into simple, beautiful and
              intuitive solutions for the web and mobile platforms.
            </p>
            <div className="flex items-center mt-auto">
              <Button
                variant="ghost"
                asChild
                size="icon"
                className="rounded-full hover:bg-slate-800 hover:text-gray-300"
              >
                <Link target="_blank" href="https://github.com/mehfoozurRehman">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                size="icon"
                className="rounded-full hover:bg-slate-800 hover:text-gray-300"
              >
                <Link
                  target="_blank"
                  href="https://www.instagram.com/mehfoozurrehman___/"
                >
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                size="icon"
                className="rounded-full hover:bg-slate-800 hover:text-gray-300"
              >
                <Link target="_blank" href="mailto:mehfoozijaz@gmail.com">
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Email</span>
                </Link>
              </Button>
              <ModeToggle />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-8">
            <div className="max-w-none flex flex-col gap-4">
              <h2 className="text-2xl text-gray-200">About</h2>
              <p>
                I’m a developer passionate about crafting accessible,
                pixel-perfect user interfaces that blend thoughtful design with
                robust engineering. My favorite work lies at the intersection of
                design and development, creating experiences that not only look
                great but are meticulously built for performance and usability.
              </p>
              <p>
                Currently, I'm a Senior Fullstack Developer at{" "}
                <Link
                  target="_blank"
                  href="https://devscot.com/"
                  className="text-teal-300 hover:underline hover:text-teal-400"
                >
                  Devscot
                </Link>
                , specializing in building scalable web applications using
                modern technologies. My expertise includes React, Next.js,
                Node.js, and cloud services, enabling me to deliver end-to-end
                solutions that drive business growth.
              </p>
              <p>
                In the past, I've worked as a Frontend Developer at{" "}
                <Link
                  target="_blank"
                  href="https://leadprofit.com"
                  className="text-teal-300 hover:underline hover:text-teal-400"
                >
                  Leadprofit
                </Link>
                , where I focused on robust frontend architectures and seamless
                user experiences. I've also collaborated with cross-functional
                teams to deliver high-quality software solutions.
              </p>
              <p>
                When I'm not coding, I enjoy exploring new technologies,
                contributing to open-source projects, and sharing knowledge.
              </p>
            </div>
            <div className="prose prose-invert max-w-none flex flex-col gap-4">
              <h2 className="text-2xl text-gray-200">Experience</h2>
            </div>
            <div className="prose prose-invert max-w-none flex flex-col gap-4">
              <h2 className="text-2xl text-gray-200">Projects</h2>
            </div>
            <div className="prose prose-invert max-w-none flex flex-col gap-4">
              <h2 className="text-2xl text-gray-200">Testimonials</h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
