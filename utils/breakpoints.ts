import { useBreakpoints } from '@vueuse/core'


const breakpoints = useBreakpoints({
    tablet: 640,
    laptop: 1024,
    desktop: 1280,
});


export const isMobile = breakpoints.smaller("laptop");