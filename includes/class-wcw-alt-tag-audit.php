<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://www.mattbev.com
 * @since      1.0.0
 *
 * @package    Wcw_Alt_Tag_Audit
 * @subpackage Wcw_Alt_Tag_Audit/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Wcw_Alt_Tag_Audit
 * @subpackage Wcw_Alt_Tag_Audit/includes
 * @author     Matthew Bevilacqua <matt@whalingcityweb.com>
 */
class Wcw_Alt_Tag_Audit {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Wcw_Alt_Tag_Audit_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'WCW_ALT_TAG_AUDIT_VERSION' ) ) {
			$this->version = WCW_ALT_TAG_AUDIT_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'wcw-alt-tag-audit';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();
	

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Wcw_Alt_Tag_Audit_Loader. Orchestrates the hooks of the plugin.
	 * - Wcw_Alt_Tag_Audit_i18n. Defines internationalization functionality.
	 * - Wcw_Alt_Tag_Audit_Admin. Defines all hooks for the admin area.
	 * - Wcw_Alt_Tag_Audit_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-wcw-alt-tag-audit-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-wcw-alt-tag-audit-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-wcw-alt-tag-audit-admin.php';


		$this->loader = new Wcw_Alt_Tag_Audit_Loader();

	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Wcw_Alt_Tag_Audit_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale() {

		$plugin_i18n = new Wcw_Alt_Tag_Audit_i18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );

	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks() {

		$plugin_admin = new Wcw_Alt_Tag_Audit_Admin( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );

       	/** set up the menu page */

	   	$this->loader->add_action( 'admin_menu', $plugin_admin, 'setup_options_page' );

	   /**
		* we need some ajax handlers
		*/

		$this->loader->add_action( 'wp_ajax_wcw_update_alt_text', $plugin_admin, 'update_alt_text' );
		$this->loader->add_action( 'wp_ajax_wcw_update_site_message', $plugin_admin, 'update_site_message' );

	 
	  
	   /**
		* handle the admin notice related to the alt tags         
		*/

		$this->loader->add_action( 'admin_notices', $plugin_admin, 'admin_notice' );

	   /**
		*  here, we set the wordpress transient to it's initial value (i.e. you need to review your alt tag situation)
		* 
		*/

		$this->loader->add_action( 'admin_init', $plugin_admin, 'set_alt_tag_transient');


	}



	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    Wcw_Alt_Tag_Audit_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}

}
