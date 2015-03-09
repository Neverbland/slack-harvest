include_recipe "nodejs"

# global npm packages
global_packages_list = %w(
  knex mocha gulp forever
)

global_packages_list.each do |name|
  nodejs_npm name do
    options ['-g']
  end
end
