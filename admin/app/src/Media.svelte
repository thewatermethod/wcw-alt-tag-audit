<script>
  import DOMPurify from "dompurify";

  // props with some sensible defaults
  export let picture = {};
  export let index = 0;
  export let removeMedia = () => {};

  // component scoped vars
  let alt = "";
  let isOdd = index % 2 === 1;

  /**
   *
   * click handler for button
   * takes an html event, sends an ajax request to wp and saves new alt text
   *
   * */
  const editAltText = e => {
    const data = {
      action: "wcw_update_alt_text",
      nonce: wcw_alt_tags.updateAltTextNonce,
      altText: DOMPurify.sanitize(alt),
      media: picture.id
    };

    // todo - this is using jquery instead of fetch for some reason, need to fix
    jQuery.post(wcw_alt_tags.ajaxUrl, data, response => {
      if (response == 0 && alt != "") {
        removeMedia(index);
        alt = "";
      }
    });
  };
</script>

<style>
  .media {
    align-items: center;
    display: flex;
    padding: 0.5em;
    max-width: 800px;
  }

  .media.media--odd {
    background-color: #f9f9f9;
  }

  .media div {
    align-items: center;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
  }

  .media img {
    padding: 0.5em;
  }
</style>

<div class={isOdd ? 'media media--odd' : 'media media--even'}>
  <div>
    <img src={picture.path} {alt} />
    <a href={picture.large} target="_blank">
      View full size (opens in new tab)
    </a>
  </div>
  <div>
    <label for={`enter_alt_text_${picture.id}`}>Enter alt text below</label>
    <input
      bind:value={alt}
      type="text"
      id={`enter_alt_text_${picture.id}`}
      name={`enter_alt_text_${picture.id}`} />
  </div>
  <div>
    <button class="button" on:click={editAltText}>Add alt text</button>
  </div>
</div>
