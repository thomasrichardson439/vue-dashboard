<template>
  <b-container>
    <b-row>
      <b-col>
        <b-button v-on:click="refresh">
          <b-icon icon="arrow-clockwise" font-scale="1"></b-icon>
        </b-button>
      </b-col>

      <b-col>
        <b-form-datepicker
          id="datepicker"
          class="mb-1"
          v-model="start"
        ></b-form-datepicker>
      </b-col>

      <b-col>
        <b-form-datepicker
          id="datepicker"
          class="mb-2"
          v-model="stop"
        ></b-form-datepicker>
      </b-col>
    </b-row>
  </b-container>
</template>

<style>
.tmp {
  background-color: lightblue;
}
</style>

<script>
export default {
  props: [],
  data() {
    return {
      start: "",
      stop: ""
    };
  },
  methods: {
    refresh() {
      this.$emit("refresh", this.start, this.stop);
    }
  },
  mounted() {}
};
</script>
