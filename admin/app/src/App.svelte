<script>
  import { onMount, afterUpdate } from "svelte";
  import Media from "./Media.svelte";

  /**
   * component scoped variables
   */

  let pictures = [];
  let more = true;
  let offset = 0;
  let perPage = 10;
  let siteMessage = false;

  const dispatchMessage = () => {
    const message = siteMessage;

    const data = {
      action: "wcw_update_site_message",
      nonce: wcw_alt_tags.updateSiteMessageNonce,
      status: message
    };

    jQuery.post(wcw_alt_tags.ajaxUrl, data, response => {
      console.log("message received master");
    });
  };

  const fetchMedia = () => {
    // rest url provided via wp_localize_script
    fetch(`${wcw_alt_tags.restUrl}?offset=${offset}`)
      .then(res => {
        return res.json();
      })
      .then(res => {
        // check to see we have at least 1
        if (res.length > 0) {
          document.cookie = "wcw_alt_clean=clean";
        } else {
          document.cookie = "wcw_alt_clean=dirty";
        }

        // check to see if we don't have at least 10
        if (res.length < 10) {
          more = false;
        }

        // sort the pic into our array
        sortMedia(res);

        // and then, if there is more pics, we do it again
        if (more) {
          offset += 10;
          fetchMedia();
        }
      });
  };

  /**
   *  return the
   * */

  const findPicSource = pic => {
    if (pic.media_details.sizes) {
      return pic.media_details.sizes.thumbnail.source_url;
    } else {
      return false;
    }
  };

  const loadMore = () => {
    perPage += 10;
  };

  const removeMedia = index => {
    pictures.splice(index, 1);
    pictures = pictures;
  };

  const sortMedia = picArray => {
    picArray.forEach(pic => {
      if (
        pic.alt_text == "" &&
        pic.media_type == "image" &&
        pic.mime_type != "image/svg+xml" &&
        pic.mime_type != "image/tiff"
      ) {
        var thumbnail = findPicSource(pic);

        if (thumbnail) {
          let picture = {
            id: pic.id,
            path: findPicSource(pic),
            large: pic.source_url
          };
          pictures = [...pictures, picture];
        }

        if (!siteMessage) {
          siteMessage = true;
          dispatchMessage();
        }
      }
    });
  };

  /***
   *
   *  lifecycle events
   *
   * */

  onMount(() => {
    fetchMedia();
    document.cookie = "wcw_alt_visited=visited;max-age=31536000";
  });

  afterUpdate(() => {
    //console.log(document.cookie.indexOf("wcw_alt_clean"));
    //if(document.cookie.indexOf("wcw_alt_clean") ){
    //}
    // if (pictures.length < 1) {
    //   document.cookie = "wcw_alt_clean=clean";
    // } else {
    //   document.cookie = "wcw_alt_clean=dirty";
    // }
  });
</script>

<style>
  .widefat {
    border: 1px solid #e5e5e5;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
  }

  p {
    padding: 0 1em;
  }

  .button-wrap {
    margin: 1em 0;
    max-width: 800px;
    text-align: center;
  }
</style>

<div class="widefat">
  <p>You have {pictures.length} alt tags to review.</p>

  {#each pictures.slice(0, perPage) as picture, index}
    <Media {picture} {index} {removeMedia} />
  {/each}

  {#if perPage < pictures.length}
    <div class="button-wrap">
      <button class="button" on:click={loadMore}>Load more</button>
    </div>
  {/if}
</div>
