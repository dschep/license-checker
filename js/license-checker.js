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

var get_repos = function(user) {
    $.getJSON('https://api.github.com/users/'+user+'/repos?callback=?', function(data) {
        if (data.meta["X-RateLimit-Remaining"] == "0") {
            $('<tr class="warning"><td colspan="2">' +
                '<i class="icon-exclamation-sign"></i> ' +
                'API rate limit exceeded</td></tr>').appendTo('tbody');
            return;
        }

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
        if (data.meta["X-RateLimit-Remaining"] == "0") {
            $row.addClass('warning')
            $row.find('.repo-status').html(
                '<i class="icon-exclamation-sign"></i>' +
                'API rate limit reached')
            return;
        }

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
