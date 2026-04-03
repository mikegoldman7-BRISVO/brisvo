import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { cn } from "../../lib/utils";

const CarouselContext = React.createContext(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("Carousel components must be used within <Carousel />.");
  }

  return context;
}

function Carousel({ className, children, initialIndex = 0, ...props }) {
  const [index, setIndex] = React.useState(initialIndex);
  const slideCount = React.useMemo(() => {
    const childArray = React.Children.toArray(children);
    const contentChild = childArray.find(child => React.isValidElement(child) && child.type === CarouselContent);

    if (!contentChild || !React.isValidElement(contentChild)) {
      return 0;
    }

    return React.Children.toArray(contentChild.props.children).length;
  }, [children]);

  React.useEffect(() => {
    if (slideCount === 0) {
      setIndex(0);
      return;
    }

    setIndex(current => Math.min(current, slideCount - 1));
  }, [slideCount]);

  React.useEffect(() => {
    if (slideCount === 0) {
      setIndex(0);
      return;
    }

    setIndex(Math.min(Math.max(initialIndex, 0), slideCount - 1));
  }, [initialIndex, slideCount]);

  const scrollPrev = React.useCallback(() => {
    setIndex(current => Math.max(current - 1, 0));
  }, []);

  const scrollNext = React.useCallback(() => {
    setIndex(current => Math.min(current + 1, slideCount - 1));
  }, [slideCount]);

  const value = React.useMemo(
    () => ({
      index,
      slideCount,
      canScrollPrev: index > 0,
      canScrollNext: index < slideCount - 1,
      scrollPrev,
      scrollNext,
    }),
    [index, slideCount, scrollPrev, scrollNext],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        data-slot="carousel"
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, children, ...props }) {
  const { index } = useCarousel();

  return (
    <div data-slot="carousel-viewport" className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0d]">
      <div
        data-slot="carousel-content"
        className={cn("flex transition-transform duration-300 ease-out", className)}
        style={{ transform: `translateX(-${index * 100}%)` }}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function CarouselItem({ className, ...props }) {
  return (
    <div
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
}

function CarouselPrevious({ className, ...props }) {
  const { canScrollPrev, scrollPrev } = useCarousel();

  return (
    <button
      type="button"
      aria-label="Previous slide"
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon className="size-5" />
    </button>
  );
}

function CarouselNext({ className, ...props }) {
  const { canScrollNext, scrollNext } = useCarousel();

  return (
    <button
      type="button"
      aria-label="Next slide"
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <ChevronRightIcon className="size-5" />
    </button>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
