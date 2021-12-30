<template>
  <b-container>
    <b-row>
      <b-col class="serialTable">
        <b-table
          hover
          :items="serialsTable"
          :fields="machineTableFields"
          @row-clicked="selectSerial"
        >
          <template v-slot:cell(Download)="row"> </template>
        </b-table>
      </b-col>

      <b-col>
        <b-row>
          <c-header v-on:refresh="getRuns" />
        </b-row>

        <b-row>
          <c-chart v-bind:cgram="rawData" />
        </b-row>

        <b-row>
          <b-table
            hover
            :items="data"
            :fields="tableFields"
            @row-clicked="selectRun"
          >
            <template v-slot:cell(Download)="row"> </template>
          </b-table>
        </b-row>
      </b-col>
    </b-row>
  </b-container>
</template>

<style>
/* Style the lines by removing the fill and applying a stroke */
.serialTable {
  max-width: 20%;
}
</style>

<script>
import { mapState } from "vuex";
import Amplify from "@aws-amplify/core";

const Logger = Amplify.Logger;
Logger.LOG_LEVEL = "DEBUG"; // to show detailed logs from Amplify library
const logger = new Logger("picker");

export default {
  data() {
    return {
      machineTableFields: ["SerialId"],
      tableFields: ["SerialId", "Start"],
      data: [{ SerialId: "test ser" }],
      rawData: [],
      loading: null,
      start: "",
      stop: "",
      selectedserial: ""
    };
  },
  methods: {
    download(item) {
      var unitEndPoint =
        process.env.VUE_APP_API_ROOT +
        "/dev/tenant/runs/" +
        item.SerialId +
        "/data";
      logger.debug(unitEndPoint);
      logger.debug(item);

      this.$http
        .get(unitEndPoint, { params: { start: item.Start } })
        .then(response => {
          logger.debug(response);
          let p = JSON.parse(response.data.Data);
          logger.debug("replacing rawData");
          logger.debug(p[0]);
          this.rawData = p.map(x => {
            return { date: new Date(x.RawTime), val: x.GC_PID_VALUE };
          });
          logger.debug(this.rawData);
          logger.debug("done");
        });
    },
    fetch: function() {
      try {
        logger.debug("Fetching data");
        this.loading = "spin";
        this.info = null;
        this.$http.defaults.headers.common["Authorization"] = this.token;

        this.$http
          .get(process.env.VUE_APP_API_ROOT + "/dev/tenant/serials")
          .then(response => {
            for (const tmp of response.data) {
              this.$store.dispatch("maka/newSerial", { serial: tmp.SerialId });
            }
          });
      } catch (err) {
        logger.debug("error ", err);
      }
    },
    getRuns: function(start, stop) {
      try {
        logger.debug("Fetching data");
        logger.debug(this.serials);
        this.loading = "spin";
        this.$http.defaults.headers.common["Authorization"] = this.token;
        this.data = [];
        let from = new Date(start + " 00:00:00");
        let to = new Date(stop + " 00:00:00");

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 0);

        logger.debug("from " + this.start);
        logger.debug("to " + this.stop);
        logger.debug(from);
        logger.debug(to);
        logger.debug(from.toISOString());
        logger.debug(to.toISOString());

        this.$http
          .get(
            process.env.VUE_APP_API_ROOT +
              "/dev/tenant/runs/" +
              this.selectedserial +
              "/list",
            {
              params: { from: from.toISOString(), to: to.toISOString() }
            }
          )
          .then(response => {
            this.loading = null;

            logger.debug(response);

            for (const s of response.data) {
              let tmp = {
                SerialId: this.selectedserial,
                Start: s.start
                // Stop: s.stop
              };
              this.data.push(tmp);
            }

            // logger.debug("control ", response.data);
          });
      } catch (err) {
        logger.debug("error ", err);
      }
    },
    selectSerial(record, index) {
      logger.debug(record);
      this.selectedserial = record.SerialId;
      logger.debug("clicked " + this.selectedserial + " " + String(index));
    },
    selectRun(record) {
      this.download(record);
    }
  },
  mounted() {
    const date = new Date();
    this.datewindow =
      "" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate();
    this.fetch();
  },
  computed: {
    ...mapState({
      serials: state => state.maka.serials,
      serialsTable: state => {
        var tmp = Array.from(state.maka.serials);
        tmp = tmp.map(x => {
          return { SerialId: x };
        });
        return tmp;
      },
      token: state => state.auth.user.signInUserSession.idToken.jwtToken
    })
  }
};
</script>
