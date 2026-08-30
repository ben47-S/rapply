import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/fr";

dayjs.extend(isoWeek);
dayjs.locale("fr");

export default dayjs;
export type { Dayjs } from "dayjs";

