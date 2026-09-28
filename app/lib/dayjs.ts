import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.locale("fr");

export default dayjs;
export type { Dayjs } from "dayjs";

