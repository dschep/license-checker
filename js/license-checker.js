$(document).ready(function() {
    $(window).bind('hashchange', function() {
        $('input').val(window.location.hash.slice(1));
        if(window.location.hash.slice(1)) {
            $('#landing').hide();
            $('#repos')
                .find('tbody tr').remove()
                .end().show();
            get_repos(window.location.hash.slice(1))
        }
        else {
            $('#landing').show();
            $('#repos').hide();
        }
    }).trigger('hashchange');

    $('form').submit(function(e) {
        e.preventDefault();
        window.location.hash = '#' + $(this).find('input').val();
    })
});

var check_ratelimit = function(data) {
    if (data.meta["X-RateLimit-Remaining"] == "0") {
        $('<div class="alert alert-error">' + 
          '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
          'API rate limit reached</div>').appendTo('#messages');
        return true;
    }
};

var get_repos = function(user) {
    $.getJSON('https://api.github.com/users/'+user+'/repos?callback=?', function(data) {
        if (check_ratelimit(data)) return;

        $.each(data.data, function() {
            var repo = this.name;
            $('tbody').append(Mustache.render(
                $('#repo-row').html(),
                {'user': user, 'repo': repo, fork: this.fork}
            ));
            var $row = $('tbody tr:last-child');
            get_repo_status(user, repo, $row);
        })
    });
};

var get_repo_status = function(user, repo, $row) {
    $.getJSON('https://api.github.com/repos/'+user+'/'+ repo+'/contents?callback=?', function(data) {
        if (check_ratelimit(data)) return;

        var files = $.grep(data.data, function(e, i) {
            return e.path.match(/.*(license|copying).*/i)
        });
        var pass = files.length > 0;
        $row.addClass(pass?'success':'error')
            .find('.repo-status').html(
                Mustache.render(
                    $('#repo-result').html(),
                    {'pass': pass, 'files': files}
                ));
    });
}
