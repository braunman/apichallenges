import { XMLBuilder, XMLParser } from "fast-xml-parser";

export const toXML = (dataInJson) => {
    const builder = new XMLBuilder();
    return builder.build(dataInJson);
}

export const toJSON = (dataInXML) => {
    const parser = new XMLParser();
    return parser.parse(dataInXML)
}