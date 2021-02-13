const PostSchema = new Schema({
	title: String,
	place: String,
	description: String,
	images: [ {path:String, filename:String} ],
	location: String,
	lat: Number,
  	lng: Number,

	author: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	reviews: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Review'
		}
	]
});

const  Post = mongoose.model("Post",PostSchema);