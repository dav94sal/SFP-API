import authorizeRequest from "../utils/auth";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";

export default async function getFields() {
    const leadFields = await fetch(
        `${VTIGER_URL}/listtypes?fieldTypeList=null`
    )

    console.log(leadFields)
}
