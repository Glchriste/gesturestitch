window.gs = {} if not gs?

class ImageDisplay_class
    constructor: ->
        # Initialize and load a grid (or other layout) of images
        @box = $("#desktop")
        # Unwrap
        @ubox = @box[0]
        # This is necessary for image placement later
        @width = @box.width()
        @height = @box.height()
    
        # Normally this would be by XHR but local can't use XHR
        # $.getJSON("images/list", {}, this.processImageList)
        this.processImageList([
            'images/jumping.jpg',
            'images/jumping_dad.jpg',
            'images/jumping_kid.jpg',
            'images/tigers.jpg'])
        
        # This comes from jquery-ui
        # TODO: Implement the LeapMotion-based equivalent
        @box.sortable()
    
    processImageList: (imlist)->
        # Load each of the images (by url) from a list
        @image_list = []
        for url in imlist
            image = new gs.Image(url: url, parent: this)
    
    exampleCanvas: ->
        old_im = gs.Image.all[0]
        new_im = new gs.Image(Image: old_im, parent: gs.ImageDisplay)
        console.log(new_im.features())
        new_im.brighten()
        new_im.save()  
        

$(->
    # Load the images when the page finishes
    gs.ImageDisplay = new ImageDisplay_class()
    setTimeout(gs.ImageDisplay.exampleCanvas, 1000)
)
