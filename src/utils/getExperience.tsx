import dayjs from "dayjs";

export default (dateString: string | number | Date) =>
  dayjs().diff(dayjs(dateString), "year");
