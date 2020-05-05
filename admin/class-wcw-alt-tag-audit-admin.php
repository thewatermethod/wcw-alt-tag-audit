<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://www.mattbev.com
 * @since      1.0.0
 *
 * @package    Wcw_Alt_Tag_Audit
 * @subpackage Wcw_Alt_Tag_Audit/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Wcw_Alt_Tag_Audit
 * @subpackage Wcw_Alt_Tag_Audit/admin
 * @author     Matthew Bevilacqua <matt@whalingcityweb.com>
 */
class Wcw_Alt_Tag_Audit_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;
	}


    public static function admin_notice() {
        
        if( $_SERVER['QUERY_STRING'] == "page=edit_alt_tags" ) {
            return;
        } 
    
        $visited_cookie = null;
        if( isset($_COOKIE['wcw_alt_visited']) ){
            $visited_cookie = santiize_text_field($_COOKIE['wcw_alt_visited']);
        }
            
        $alt_text_needs_review = get_transient( '_alt_text_needs_review');

        $link_to = 'tools.php?page=edit_alt_tags';

        if( $visited_cookie == null || $alt_text_needs_review == 'needs_review')  {
            ?>

            <div class="notice notice-warning is-dismissible">
                <p>You may have images that require their alt text reviewed. <a href="<?php echo admin_url($link_to); ?>">Double check your alt text as soon as possible.</a></p>
            </div>

            <?php

            return;
        }          
       
         

        if( $alt_text_needs_review == 'true') :
        ?>

            <div class="notice notice-error is-dismissible">
                <p>You have images that require their alt text reviewed. <a href="<?php echo admin_url($link_to); ?>">Please address these issues as soon as possible.</a></p>
            </div>
        
        <?php

        endif;

    }
 
	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles($hook) {

		if( $hook != 'tools_page_edit_alt_tags' ) {
            return;            
        }

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'app/public/build/bundle.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts($hook) {

  
		if( $hook != 'tools_page_edit_alt_tags' ) {
            return;            
        }

        wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'app/public/build/bundle.js', array(), $this->version, true );

        wp_localize_script( $this->plugin_name, 'wcw_alt_tags', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'restUrl' => rest_url( 'wp/v2/media' ),
            'updateSiteMessageNonce' => wp_create_nonce('wcw_update_site_message'),
            'updateAltTextNonce' => wp_create_nonce('wcw_update_alt_text'),      
        ) );
	}

	public static function get_alt_tags_message() {
        $message = get_transient( '_alt_text_needs_review');   
        return $message;
    }


	
    public function render_options_page(){ ?>
        <div class="notice notice-info is-dismissible">
            <p>If you're stuck, Penn State has <a href="http://accessibility.psu.edu/images/imageshtml/">a great guide</a> to ALT text.</p>
        </div>
        
        <div class="wrap">
           <div id="altTagRoot"></div>
        </div>

    <?php
        
    }

	
    public static function set_alt_tag_transient() {

        if( !get_transient('_alt_text_needs_review') ) {
            set_transient( '_alt_text_needs_review', 'needs_review' );
        }
    
    }

	
    public function setup_options_page() {
        add_submenu_page( 'tools.php', 'Alt Tags Audit', 'Alt Tags Audit', 'edit_posts', 'edit_alt_tags', array( __CLASS__, 'render_options_page') ); 
	}
	
	
    public function update_alt_text() {


        /** Let's verify that nonce */
        if( !isset($_POST['nonce']) || !wp_verify_nonce( sanitize_text_field($_POST['nonce']), 'wcw_update_alt_text' ) ) {   
            wp_die();
        }          
           

        $post_id = intval(santize_text_field($_POST['media']));
        $alt_text = santize_text_field($_POST['altText']);

        return update_post_meta( $post_id, '_wp_attachment_image_alt', $alt_text );        

	}
	
	
    public function update_site_message() {
    
        /** Let's verify that nonce */
        if( !isset($_POST['nonce']) || !wp_verify_nonce( sanitize_text_field($_POST['nonce']), 'wcw_update_site_message' ) ) {               
           wp_die();
        }

        if(!isset( $_POST['status'])) {
            wp_die();
        }

        set_transient( '_alt_text_needs_review', sanitize_text_field($_POST['status']));        
        wp_die();

    }


}
