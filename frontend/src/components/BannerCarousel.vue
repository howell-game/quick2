<template>

  <div class="banner-carousel-wrapper">

    <div class="w-full h-[160px] overflow-hidden relative">

      <transition-group
        name="slide"
        tag="div"
        class="w-full h-full relative"
      >

        <div
          v-if="currentSlide"
          :key="currentSlideIndex"
          class="banner-slide"
        >

          <img
            :src="currentSlide.image"
            :alt="currentSlide.alt"
            class="banner-image"
          />

        </div>

      </transition-group>

    </div>

  </div>

</template>

<script>

export default {

  name: "BannerCarousel",

  data() {

    return {

      currentSlideIndex: 0,

      slides: [

        {
          image: "/images/signup-bonus.jpg",
          alt: "₦250 SignUp Bonus"
        },

        {
          image: "/images/win-5-mins.jpg",
          alt: "Win in 5 mins"
        },

        {
          image: "/images/view-trend.jpg",
          alt: "Always View Trend"
        },

        {
          image: "/images/play-smart.jpg",
          alt: "Play Smart, Win, Repeat"
        },

        {
          image: "/images/naija-howfar.jpg",
          alt: "Naija Howfar"
        },

        {
          image: "/images/no-stress.jpg",
          alt: "No Stress, Win"
        }

      ],

      interval: null

    };

  },


  computed: {

    currentSlide() {

      return this.slides[
        this.currentSlideIndex
      ];

    }

  },


  mounted() {

    this.startRotation();

  },


  beforeDestroy() {

    clearInterval(this.interval);

  },


  methods: {

    startRotation() {

      this.interval =
        setInterval(() => {

          this.currentSlideIndex =
            (
              this.currentSlideIndex + 1
            ) %
            this.slides.length;

        }, 8000);

    }

  }

};

</script>

<style>

.slide-enter-active,
.slide-leave-active {

  transition:
    transform 0.8s ease-in-out,
    opacity 0.8s ease-in-out;

}

.slide-enter-from {

  opacity: 0;

  transform:
    translateX(100%);

}

.slide-leave-to {

  opacity: 0;

  transform:
    translateX(-100%);

}

.banner-slide {

  position: absolute;

  inset: 0;

  width: 100%;

  height: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  overflow: hidden;

}

.banner-image {

  width: 100%;

  height: 100%;

  object-fit: cover;

  display: block;

}

@media (min-width: 768px) {
  .banner-text {
    font-size: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .banner-text {
    font-size: 3rem;
  }
}

/* Background color classes */
.bg-purple {
  background: linear-gradient(45deg, #7b2cbf,rgb(20, 4, 33));
}

.bg-red {
  background: linear-gradient(45deg, #d00000,rgb(184, 209, 45));
}
.bg-luck {
  background: linear-gradient(45deg,rgb(0, 208, 28),rgb(51, 7, 15));
}
.bg-violet {
  background: linear-gradient(45deg,rgba(164, 21, 21, 0.73),rgb(20, 130, 16));
}
.bg-blue {
  background: linear-gradient(45deg, #1d3557,rgb(173, 49, 113));
}

.bg-orange {
  background: linear-gradient(45deg,rgb(116, 57, 12),rgb(25, 25, 203));
}

.bg-green {
  background: linear-gradient(45deg,rgb(40, 172, 113),rgb(4, 26, 14));
}

.bg-yellow {
  background: linear-gradient(45deg, #fca311,rgb(46, 43, 21));
  color: black !important;
}
</style>