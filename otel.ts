import { ExuluOtel } from "@exulu/backend";

const otel = ExuluOtel.create({
    SIGNOZ_TRACES_URL: process.env.SIGNOZ_TRACES_URL!,
    SIGNOZ_LOGS_URL: process.env.SIGNOZ_LOGS_URL!,
    SIGNOZ_ACCESS_TOKEN: process.env.SIGNOZ_ACCESS_TOKEN!
});

otel.start();