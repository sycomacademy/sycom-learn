import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function CarouselDemo() {
  return (
    <div className="@4xl:flex hidden w-full flex-col items-center gap-4">
      <Carousel className="max-w-sm *:data-[slot=carousel-next]:hidden *:data-[slot=carousel-previous]:hidden *:data-[slot=carousel-next]:md:inline-flex *:data-[slot=carousel-previous]:md:inline-flex">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="font-semibold text-4xl">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <Carousel
        className="max-w-sm *:data-[slot=carousel-next]:hidden *:data-[slot=carousel-previous]:hidden *:data-[slot=carousel-next]:md:inline-flex *:data-[slot=carousel-previous]:md:inline-flex"
        opts={{
          align: "start",
        }}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem className="md:basis-1/2 lg:basis-1/3" key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="font-semibold text-3xl">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <Carousel className="max-w-sm *:data-[slot=carousel-next]:hidden *:data-[slot=carousel-previous]:hidden *:data-[slot=carousel-next]:md:inline-flex *:data-[slot=carousel-previous]:md:inline-flex">
        <CarouselContent className="-ml-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem className="pl-1 md:basis-1/2" key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="font-semibold text-2xl">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
