import clientPromise from "../../../lib/mongodb";
import withSub from "../../../lib/withSub";

async function handler(req, res) {

    const { method, sub, body } = req

    const client = await clientPromise
    const db = client.db("test")

    if (method === "GET") {
        const forms = await db.collection("forms").aggregate([
            {
                $match: {
                    "user_id": sub
                }
            },
            {
                $lookup: {
                    from: "submissions",
                    localField: "_id",
                    foreignField: "form_id",
                    as: "submissions",
                }
            },
            {
                $project: {
                    "title": 1,
                    "total": {
                        $size: "$submissions"
                    },
                    "unread": {
                        $size: {
                            $filter: {
                                input: "$submissions",
                                as: "submissions",
                                cond: {
                                    $eq: ["$$submissions.is_viewed", false]
                                }
                            }
                        }
                    }
                }
            }
        ]).toArray()
        res.status(200).json(forms)
    }

    if (method === "POST") {
        console.log(`Title ${body.title}`)
        const data = await db.collection("forms").insert({
            user_id: sub,
            created_at: new Date(),
            title: body.title
        })
        res.status(200).json(data)
    }

}

export default withSub(handler)