<template>

<div class="page">

<TrendGraph
    :categoryId="Number($route.params.categoryId)"
/>

</div>

</template>

<script>

import TrendGraph from "@/components/TrendGraph.vue";

export default{

components:{
TrendGraph
}

}

</script>