const Destination=require('../models/destination');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index =async(req,res)=>{
    const place=await Destination.find({});
    res.render('destinations/index',{place});
}
module.exports.renderNewForm=async(req,res)=>{
    res.render('destinations/new');
    
}

module.exports.createDestination=async(req,res)=>{
    const geoData = await geocoder.forwardGeocode({
        query: req.body.destination.location,
        limit: 1
    }).send()
  
    
    const place=new Destination(req.body.destination);
    place.geometry = geoData.body.features[0].geometry;

    place.images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    place.author = req.user._id;
    await place.save();
    console.log(place);
    req.flash('success','successfully created a new desti')
    res.redirect(`/destination/${place._id}`)
}

module.exports.showDestination=async(req,res)=>{
    const place=await Destination.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
        }).populate('author');
    console.log(place);
    console.log(place.author._id);
     if(!place)
     {
        req.flash('error','cannot find destination')
          res.redirect('/destination')
     }
     else
    res.render('destinations/show',{place});
}

module.exports.editDestination=async(req,res)=>{
    const {id}=req.params;
    const place=await Destination.findById(req.params.id);
    if(!place)
     {
        req.flash('error','cannot find destination')
          res.redirect('/destination')
     }
     else
    res.render('destinations/edit',{place});
}
module.exports.updateDestination=async(req,res)=>{
    const {id}=req.params;
    const place=await Destination.findByIdAndUpdate(id,{ ...req.body.destination});
    const imgs=req.files.map(f => ({ url: f.path, filename: f.filename }));
    place.images.push(...imgs);
    await place.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success','successfully updated desti')
  
   res.redirect(`/destination/${place._id}`);
  }


  module.exports.deleteDestination=async(req,res)=>{
    const {id}=req.params;
    await Destination.findByIdAndDelete(id);
    req.flash('success','successfully deleted desti')

   res.redirect("/destination");
  }
